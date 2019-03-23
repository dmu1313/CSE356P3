
import React from 'react';
import { Route } from 'react-router-dom';

import {App} from './App';
import {Home} from './Home';
import {NavBar} from './Navigation';
import {SuccessNewAccountPage} from './Accounts';
import {LoginPage} from './LoginPage';

class LoginStatus extends React.Component {
    constructor(props) {
        super(props);

        // fetch request to determine if logged in.

        this.getLoginStatus = this.getLoginStatus.bind(this);

        this.state = { loggedIn: false };
        this.justChanged = false;
    }

    getLoginStatus() {

        console.log("get login status was called");
        // fetch request to determine if logged in.
        var status = false;

        if (this.state.loggedIn !== status) {
            this.justChanged = true;
            this.setState({ loggedIn: status })
        }
        return status;
    }

    render() {
        console.log("LoginStatus was rendered.");
        let changed = this.justChanged;
        this.justChanged = false;
        
        let status;
        if (!changed) {
            status = this.getLoginStatus();
        }
        else {
            status = this.state.loggedIn;
        }

        return (
        <React.Fragment>
            <NavBar loggedIn={status} />
            <Route exact path = "/" render={ (props) => <App {...props} loggedIn={status} /> } />
            <Route path = "/Home" render={ (props) => <Home {...props} loggedIn={status} /> } />
            <Route path="/Search" render={ (props) => <Home {...props} loggedIn={status} /> } />
            <Route path="/NewAccount" component={SuccessNewAccountPage} />
            <Route path="/Login" render={ (props) => <LoginPage {...props} loggedIn={status} /> } />
            <Route path="/AddQuestion" />
            <Route path="/Question/:id" />
        </React.Fragment>
        );
    }
}

export {LoginStatus};