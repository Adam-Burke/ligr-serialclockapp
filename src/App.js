import React, { Component } from 'react';
import io from 'socket.io-client';
import logo from './logo.svg';
import {Button, Select, Header} from 'semantic-ui-react';
import './App.css';
import '../semantic/dist/semantic.min.css';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clockValue: null,
      ports: null,
      selectedPort: null,
      status: null
    };
    this.socket = io(`http://localhost:42049`);
    this.socket.on('clockUpdate', data => {
      console.log('clockUpdate');
      this.setState({data})
    });
    this.socket.on('newList', (data) => {
      console.log('newList');
      this.setState({ports: data})
    });
    this.socket.on('connected', (data) => {
      console.log('connected');
      this.setState({status: 'connected', selectedPort: data.connectedPort || this.state.selectedPort})
    });
    this.socket.on('close', () => {
      console.log('close');
      this.setState({status: null})
    });
    this.sendMessage = this.sendMessage.bind(this);
  }

  sendMessage(message) {
    return () => {
      console.log(message.type);
      this.socket.emit(message.type, message);
    }
  }

  portChange() {
    return (event, target) => {
      console.log(target.value);
      this.setState({selectedPort: target.value});
    }
  }

  handleConnectClick() {
    return () => {
      if (this.state.status === 'connected') {
        this.sendMessage({type: 'refresh', comName: this.state.selectedPort})();
      }
      else {
        this.sendMessage({type: 'open', comName: this.state.selectedPort})();
      }
    }
  }

  closeConnection() {
    return () => {
      console.log('b');
      this.sendMessage({type: 'close'})();
    }
  }

  render() {
    return (
      <div>
        <Button onClick={this.sendMessage({type: 'refreshList'})}>REFRESH PORT LIST</Button>
        {this.state.ports ? <Select onChange={this.portChange()} options={
          this.state.ports.map(port => {
            console.log(port);
            return {text: port.comName, value: port.comName}
          })
        }/> : null}
        {this.state.selectedPort ? <Button onClick={this.handleConnectClick()}>{this.state.status !== 'connected' ? 'OPEN CONNECTION' : 'REFRESH CONNECTION'}</Button> : null}
        {this.state.status === 'connected' ? <Button onClick={this.closeConnection()}>CLOSE CONNECTION</Button> : null}
        {this.state.clockValue ? <Header>{this.state.clockValue}</Header> : null}
      </div>
    );
  }
}

export default App;
