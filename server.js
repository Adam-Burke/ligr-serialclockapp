// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const http = require('http');
const socketIO = require('socket.io');
const SerialPort = require('serialport');

module.exports = () => {
  const server = http.createServer();
  const io = socketIO(server);
  let port;
  let connectedPort;
  const getPortList = (callback) => {
    SerialPort.list((error, ports) => {
      if (error) {
        this.error = error;
        return;
      }
      callback(ports);
    });
  };

  const handleError = client => {
    return error => {
      client.emit('error', error);
    }
  };

  const parseData = () => {
    return data => {
      console.log('parseData_resp');
      console.log(data);
      let dataString = '';
      let startIndex;
      let finishIndex;
      let firstTwoFound = false;
      Object.keys(data).forEach(function (key, index) {
        if (data[key] === 2) {
          if (firstTwoFound === false) {
            firstTwoFound = true;
          }
          else {
            startIndex = index + 1;
          }
        }
        if (data[key] === 4) {
          finishIndex = index - 1;
        }
      });
      //test this
      if((startIndex !== undefined) && (finishIndex !== undefined)) {
        Object.keys(data).forEach(function (key, index) {
          if (index < startIndex) {
            return;
          }
          if (index > finishIndex && dataString.indexOf('.') > -1) {
            io.sockets.emit('clockUpdate', dataString);
            return;
          }
          dataString += String.fromCharCode(data[key])
        });
      }
    }
  };

  const handleClose = client => {
    return () => {
      console.log('close_res');
      client.emit('close', {});
    }
  };

  const handleOpen = (client, port) => {
    return () => {
      console.log('connected_res');
      port.write('testing attention please');
      client.emit('connected', {connectedPort: connectedPort});
    }
  };

  io.on('connection', (client) => {
    //in here we need to use the serialPort connection to on data events send that message to the clock.
    console.log('socket connected');
    client.on('refreshList', () => {
      getPortList(ports => {
        client.emit('newList', ports);
      });
    });
    client.on('close', () => {
      console.log('close_req');
      if (port) port.close();
    });
    client.on('refresh', () => {
      console.log('refresh_req');
      if (port) port.close(() => {
        port.open();
      });
    });
    client.on('open', data => {
      console.log('open_req');
      console.log('comName');
      console.log(data.comName);
      connectedPort = data;
      console.log(port);
      if (!port) {
        port = port || new SerialPort(data.comName, {
            baudrate: 9600,
            encoding: 'ascii',
            bufferSize: 64000,
            dataBits: 8,
            autoOpen: false
          });
        port.on('open', handleOpen(client, port));
        port.on('data', parseData());
        port.on('error', handleError(client));
        port.on('close', handleClose(client));
        port.on('disconnect', handleClose());
      }
      port.open();
    });
  });


  server.listen(42049);
};




