
import React from 'react';
import { Route } from 'react-router-dom';

import {App} from './App';
import {Home} from './Home';
import {NavBar} from './Navigation';
import {SuccessNewAccountPage} from './Accounts';
import {LoginPage, LogoutPage} from './LoginPage';
import {VerifyPage} from './Verify';
import {QuestionPage} from './Questions';
import {QuestionsPage} from './QuestionsPage';

class LoginStatus extends React.Component {
    constructor(props) {
        super(props);

        // fetch request to determine if logged in.

        this.setLoginState = this.setLoginState.bind(this);
        this.getLoginStatus = this.getLoginStatus.bind(this);

        this.state = { loggedIn: false, notification: "" };
        this.justChanged = false;
    }

    setLoginState(loggedIn, notification) {
        this.setState( {loggedIn: loggedIn, notification: notification} );
    }

    getLoginStatus() {
        console.log("get login status was called");
        var me = this;

        // fetch request to determine if logged in.
        // var status = await 
        return fetch('/CheckLoginStatus', {
            method: "POST",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (me.state.loggedIn !== json.loggedIn) {
                me.justChanged = true;
                me.setState({ loggedIn: json.loggedIn })
            }
            if (json.loggedIn === true) {
                return true;
            }
            else {
                return false;
            }
        })
        .catch(function(error) {
            console.log("Failed to find out if you are logged in: " + error);
            return false;
        });

        // console.log("STATUS: " + status);

        // if (this.state.loggedIn !== status) {
        //     this.justChanged = true;
        //     this.setState({ loggedIn: status })
        // }
        // // this.setState({loggedIn: status});
        // return status;
    }

    render() {

        var status = this.state.loggedIn;
        // console.log("LoginStatus was rendered.");
        // let changed = this.justChanged;
        // this.justChanged = false;
        
        // let status;
        // if (!changed) {
        //     console.log("HI");
        //     status = this.getLoginStatus();
        //     console.log("BYE");
        // }
        // else {
        //     status = this.state.loggedIn;
        // }

        return (
        <React.Fragment>
            <NavBar loggedIn={status} />
            <Route exact path = "/" render={ (props) => <App {...props} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path = "/Home" render={ (props) => <Home {...props} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/Search" render={ (props) => <Home {...props} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/NewAccount" render={ (props) => <SuccessNewAccountPage {...props} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} />} />
            <Route path="/Login" render={ (props) => <LoginPage {...props} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/Logout" render={ (props) => <LogoutPage {...props} action="/logout" notification={this.state.notification} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/Verify" component={VerifyPage} />
            <Route path="/Questions" component={QuestionsPage} />
            <Route path="/Question/:id" component={QuestionPage} />
        </React.Fragment>
        );
    }
}

export {LoginStatus};