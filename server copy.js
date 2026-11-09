const ModbusRTU = require("modbus-serial");
const WebSocket = require('ws');

// ================= 配置区 =================
const portPath = 'COM3';
const baudRate = 9600;
const slaveId = 2;

// ⚠️【关键！根据变送器内部小数点设置修改除数！】
// 手册：小数点位置 3(出厂默认，百位) → divisor = 100
// 小数点4(千位) → divisor =1000
const DIVISOR = 1000; 

// ⚠️报警阈值：单位和pressure保持一致(MPa)，例如超压2.0MPa报警
const PRESSURE_MAX = 10.0;
// ==========================================

const client = new ModbusRTU();
let pollTimer = null;

// websocket
const wss = new WebSocket.Server({ port: 8080 });
let clients = [];
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => { clients = clients.filter(c => c !== ws); });
});
function broadcast(data) {
  clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(data));
  });
}

// 关闭旧轮询
function stopPoll(){
  if(pollTimer){
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function startPolling() {
  stopPoll();
  try{
    await client.connectRTUBuffered(portPath, {
      baudRate: baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: "none"
    });
    console.log(`串口 ${portPath} 打开成功，从机ID:${slaveId}`);
    client.setID(slaveId);
    client.setTimeout(1000);

    pollTimer = setInterval(async () => {
      try {
        const res = await client.readHoldingRegisters(0, 1);
        let rawValue = res.data[0];
        console.log("Modbus原始寄存器值：", rawValue);

        // 处理有符号双极性
        if (rawValue > 32767) {
          rawValue = rawValue - 65536;
        }
        // 换算物理压力
        let pressure = rawValue / DIVISOR;

        const isWarn = pressure > PRESSURE_MAX;
        const status = isWarn ? '超压报警' : '正常';

        const result = {
          pressure: pressure.toFixed(3),
          status: status,
          warn: isWarn,
          time: new Date().toLocaleTimeString(),
          hum: 0,
          isAlarm: isWarn,
          alarmMsg: isWarn ? '压力超标' : ''
        };
        broadcast(result);
      } catch (e) {
        console.error("读取寄存器异常：", e.message);
      }
    }, 500);

  }catch(err){
    console.error("串口打开失败：", err.message);
    stopPoll();
    setTimeout(startPolling,3000);
  }
}

// 监听modbus底层断开事件，自动重连
client.on('close',()=>{
  console.warn("串口连接断开，准备重连...");
  stopPoll();
  setTimeout(startPolling,3000);
})

startPolling();
console.log('压力监控服务启动 ws://127.0.0.1:8080');
