
import React from 'react';
import { Route } from 'react-router-dom';

import {Home} from './Home';
import {NavBar} from './Navigation';
import {SuccessNewAccountPage} from './Accounts';
import {LoginPage, LogoutPage} from './LoginPage';
import {VerifyPage} from './Verify';
import {questionPage as QuestionPage} from './Questions';
import {QuestionsPage} from './QuestionsPage';
import {MediaPage} from './Media.js';
import {SearchPage} from './SearchPage.js';
import {usersPage as UsersPage} from './Users.js';
import {UserPage} from './Users.js';

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
            <Route exact path = "/" render={ (props) => <Home {...props} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/Search" render={ (props) => <SearchPage {...props} action="/search" loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/NewAccount" render={ (props) => <SuccessNewAccountPage {...props} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} />} />
            <Route path="/Login" render={ (props) => <LoginPage {...props} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/Logout" render={ (props) => <LogoutPage {...props} action="/logout" notification={this.state.notification} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/Verify" component={VerifyPage} />
            <Route path="/Questions" render={ (props) => <QuestionsPage {...props} notification={this.state.notification} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> }  />
            <Route path="/Question/:id" render={ (props) => <QuestionPage {...props} notification={this.state.notification} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> }  />
            <Route path="/Media" render={ (props) => <MediaPage {...props} action="/addmedia" notification={this.state.notification} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/Users" render={ (props) => <UsersPage {...props} notification={this.state.notification} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
            <Route path="/User/:username" render={ (props) => <UserPage {...props} notification={this.state.notification} loggedIn={status} getLoginStatus={this.getLoginStatus} setLoginState={this.setLoginState} /> } />
        </React.Fragment>
        );
    }
}

export {LoginStatus};