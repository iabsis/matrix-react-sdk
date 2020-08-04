import React, { Component } from 'react';
// import './App.css';
import axios from 'axios';
import OpenViduSession from 'openvidu-react';

class OpenViduCallView extends Component {
    constructor(props) {
        super(props);
        this.OPENVIDU_SERVER_URL = 'https://openvidu2.dev.oniabsis.com/';
        this.OPENVIDU_SERVER_SECRET = 'pfcqopfs';
        // this.OPENVIDU_SERVER_URL = 'https://127.0.0.1:4443/';
        // this.OPENVIDU_SERVER_SECRET = 'MY_SECRET';
        this.state = {
            mySessionId: 'SessionA',
            myUserName: 'OpenVidu_User_' + Math.floor(Math.random() * 100),
            token: undefined,
        };

        this.handlerJoinSessionEvent = this.handlerJoinSessionEvent.bind(this);
        this.handlerLeaveSessionEvent = this.handlerLeaveSessionEvent.bind(this);
        this.handlerErrorEvent = this.handlerErrorEvent.bind(this);
        this.handleChangeSessionId = this.handleChangeSessionId.bind(this);
        this.handleChangeUserName = this.handleChangeUserName.bind(this);
        this.joinSession = this.joinSession.bind(this);
    }

    componentDidMount(){
        this.joinSession()
    }
    handlerJoinSessionEvent() {
        console.log('Join session');
    }

    handlerLeaveSessionEvent() {
        console.log('Leave session');
        this.setState({
            session: undefined,
        });
    }

    handlerErrorEvent() {
        console.log('Leave session');
    }

    handleChangeSessionId(e) {
        this.setState({
            mySessionId: e.target.value,
        });
    }

    handleChangeUserName(e) {
        this.setState({
            myUserName: e.target.value,
        });
    }

    joinSession(event=null) {
        if (this.state.mySessionId && this.state.myUserName) {
            this.getToken().then((token) => {
                this.setState({
                    token: token,
                    session: true,
                });
            });
            if(event){

                event.preventDefault();
            }
        }
    }

    render() {
        const mySessionId = this.state.mySessionId;
        const myUserName = this.state.myUserName;
        const token = this.state.token;
        return (
            <div>

                    <div id="session">
                        <OpenViduSession
                            id="opv-session"
                            openviduServerUrl={this.OPENVIDU_SERVER_URL}
                            openviduSecret={this.OPENVIDU_SERVER_SECRET}
                            sessionName={mySessionId}
                            user={myUserName}
                            token={token}
                            joinSession={this.handlerJoinSessionEvent}
                            leaveSession={this.handlerLeaveSessionEvent}
                            error={this.handlerErrorEvent}
                        />
                    </div>

            </div>
        );
    }

    /**
     * --------------------------
     * SERVER-SIDE RESPONSIBILITY
     * --------------------------
     * These methods retrieve the mandatory user token from OpenVidu Server.
     * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
     * the API REST, openvidu-java-client or openvidu-node-client):
     *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
     *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
     *   3) The token must be consumed in Session.connect() method
     */

    getToken() {
        return this.createSession(this.state.mySessionId)
            .then((sessionId) => this.createToken(sessionId))
            .catch((Err) => console.error(Err));
    }

    createSession(sessionId) {

        return new Promise((resolve, reject) => {
            const data = JSON.stringify({ customSessionId: sessionId });
            axios
                .post(this.OPENVIDU_SERVER_URL + '/api/sessions', data, {
                    headers: {
                        "Authorization": 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => {
                    console.log('CREATE SESION', response);
                    resolve(response.data.id);
                })
                .catch((response) => {
                    const error = Object.assign({}, response);
                    if (error.response && error.response.status === 409) {
                        resolve(sessionId);
                    } else {
                        console.log(error);
                        console.warn(
                            'No connection to OpenVidu Server. This may be a certificate error at ' + this.OPENVIDU_SERVER_URL,
                        );
                        if (
                            window.confirm(
                                'No connection to OpenVidu Server. This may be a certificate error at "' +
                                    this.OPENVIDU_SERVER_URL +
                                    '"\n\nClick OK to navigate and accept it. ' +
                                    'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                                    this.OPENVIDU_SERVER_URL +
                                    '"',
                            )
                        ) {
                            window.location.assign(this.OPENVIDU_SERVER_URL + '/accept-certificate');
                        }
                    }
                });
        });
    }

    createToken(sessionId) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({ session: sessionId });
            axios
                .post(this.OPENVIDU_SERVER_URL + '/api/tokens', data, {
                    headers: {
                        "Authorization": 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => {
                    console.log('TOKEN', response);
                    resolve(response.data.token);
                })
                .catch((error) => reject(error));
        });
    }
}

export default OpenViduCallView;
