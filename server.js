const ModbusRTU = require("modbus-serial");
const WebSocket = require('ws');

// ================= 配置区 =================
const portPath = 'COM3';
const baudRate = 9600;
const slaveId = 2;
const DIVISOR = 1000;
const PRESSURE_MAX = 10.0;

// ================= 模拟压力数据（测试用，传感器未加压时开启） =================
// 现在压力传感器没有加压，Modbus 读数一直是 0，无法看到数据曲线。
// 开启此开关后不读传感器，改为模拟压力：
//   按正弦波形模拟——压力从 0 平滑升到 1 MPa，再平滑回落到 0，循环往复（无直线段、峰谷圆滑），
//   用于测试数据曲线展示。
// 传感器接好、正式校验时，把 SIMULATE_PRESSURE 改为 false 即可恢复读取真实传感器数据。
const SIMULATE_PRESSURE = true;              // true=使用模拟压力测试曲线；false=读取真实传感器（Modbus）
const SIM_MAX = 1;                           // 模拟压力峰值 (MPa)
const SIM_PERIOD = 30;                      // 一个完整周期（秒）：0 → 1 → 0
const SIM_START = Date.now();                // 模拟起始时间，用于按时间计算正弦相位
// ==========================================================================

const client = new ModbusRTU();
let pollTimer = null;
let isPolling = false; // 轮询状态标志位

// websocket
const wss = new WebSocket.Server({ port: 8080 });
let clients = [];

// ================= 轮询控制函数 =================
const startPollingTimer = () => {
  if (isPolling) return;
  isPolling = true;
  pollTimer = setInterval(async () => {
    // ================= 模拟压力分支（测试用） =================
    // 正弦波形：0 → 1 MPa 平滑上升 → 平滑回落 → 0，周期 SIM_PERIOD 秒，循环。
    // 正弦波让峰谷都是圆弧过渡，比线性爬坡更接近真实加压/泄压曲线。
    // 正式使用时将顶部 SIMULATE_PRESSURE 改为 false，走下方真实传感器分支。
    if (SIMULATE_PRESSURE) {
      const elapsed = (Date.now() - SIM_START) / 1000;                                    // 已运行秒数
      const phase = (2 * Math.PI * elapsed) / SIM_PERIOD;                                 // 正弦相位
      simPressure = (SIM_MAX * (1 - Math.cos(phase))) / 2;                                // 0→1→0 平滑循环

      const pressure = Number(simPressure.toFixed(2)); // 与真实数据一致：保留两位小数
      const isWarn = pressure > PRESSURE_MAX;
      const status = isWarn ? '超压报警' : '正常';
      broadcast({
        pressure,
        status,
        warn: isWarn,
        time: new Date().toLocaleTimeString()
      });
      return; // 模拟模式下不读 Modbus，直接下发下一帧
    }
    // ================= 真实传感器分支 =================
    if (!client.isOpen) return;
    try {
      // 读寄存器地址 0，长度 1
      const res = await client.readHoldingRegisters(0, 1);
      let rawValue = res.data[0];
      
      // 处理双极性负数
      if (rawValue > 32767) {
        rawValue = rawValue - 65536;
      }
      let pressure = rawValue / DIVISOR;
      // if (pressure < 0) pressure = 0; // 防止负压漂移
      pressure = Number(pressure.toFixed(2)); // 在源头保留两位小数
      const isWarn = pressure > PRESSURE_MAX;
      const status = isWarn ? '超压报警' : '正常';

      const result = {
        pressure,
        status,
        warn: isWarn,
        time: new Date().toLocaleTimeString()
      };
      broadcast(result);
    } catch (e) {
      console.error("读取寄存器异常：", e.message);
    }
  }, 1000);
};

const stopPollingTimer = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  isPolling = false;
};

// ================= WebSocket 逻辑 =================
wss.on('connection', (ws) => {
  clients.push(ws);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      // ================= 零点校验请求 =================
      if (data.action === 'zeroCalibrate') {
        console.log("收到前端零点校准指令，准备发送 Modbus 命令...");
        
        if (!client.isOpen) {
          ws.send(JSON.stringify({ type: 'msg', message: '校准失败：串口未连接' }));
          return;
        }

        // ⚠️ 核心修复：发送校准前，必须先暂停轮询，防止串口抢占导致超时
        stopPollingTimer(); 
        
        // 稍微延迟一下，确保之前的轮询请求彻底结束
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
          // 说明书第19页：零点校准写入寄存器 0x0060 (十进制 96)，写入值 0x0001
          // await client.writeRegister(96, 1);


          const res = await client.writeRegister(96, 1);
          // ⚠️ 打印返回值，看看传感器回了什么
          console.log("传感器原始回应数据:", res); 


          console.log("零点校准指令发送成功");
          broadcast({ type: 'msg', message: '零点校准完成！' });
        } catch (err) {
          console.error("校准失败:", err.message);
          ws.send(JSON.stringify({ type: 'msg', message: `校准失败：${err.message}` }));
        } finally {
          // 无论成功还是失败，最后都要恢复轮询
          console.log("恢复数据轮询...");
          startPollingTimer();
        }
      }
      // ================= 处理：切换设备地址 =================
      if (data.action === 'switchAddress') {
        const newAddr = parseInt(data.address);
        console.log(`收到前端指令：准备切换从机地址为 ${newAddr}`);
        
        // 1. 暂停轮询
        stopPollingTimer();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 2. 修改 modbus 从机 ID
        if (client.isOpen) {
          client.setID(newAddr);
          console.log(`Modbus 从机地址已成功切换为: ${newAddr}`);
        }
        
        // 3. 恢复轮询
        startPollingTimer();
        
        // 4. 通知前端切换成功（重置一下图表状态）
        broadcast({ type: 'msg', message: `已成功切换到设备地址 ${newAddr}，请等待数据刷新` });
      }
    } catch (e) {
      console.error("解析前端消息失败:", e);
    }
  });

  ws.on('close', () => { clients = clients.filter(c => c !== ws); });
});

function broadcast(data) {
  clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(data));
  });
}

// ================= 串口连接与主流程 =================
async function connectSerial() {
  stopPollingTimer();
  try{
    await client.connectRTUBuffered(portPath, {
      baudRate: baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: "none"
    });
    console.log(`串口 ${portPath} 打开成功，从机ID:${slaveId}`);
    client.setID(slaveId);
    // 适当延长超时时间，有些国产硬件响应较慢
    client.setTimeout(2000); 

    // 启动定时轮询
    startPollingTimer();

  }catch(err){
    console.error("串口打开失败：", err.message);
    setTimeout(connectSerial, 3000);
  }
}

// 监听modbus底层断开事件，自动重连
client.on('close',()=>{
  console.warn("串口连接断开，准备重连...");
  stopPollingTimer();
  setTimeout(connectSerial, 3000);
});

// 启动服务
connectSerial();
console.log('压力监控服务启动 ws://127.0.0.1:8080');