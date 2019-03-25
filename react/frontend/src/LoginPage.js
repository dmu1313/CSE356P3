
import React from 'react';

import LoginForm from './Login';
import CreateAccountForm from './Accounts';

import {STATUS_OK} from './Utils';

class LoginPage extends React.Component {

    componentDidMount() {
        var me = this;
        this.props.getLoginStatus()
        .then(function(status) {
            if (status !== me.props.loggedIn) {
                me.props.setLoginState(status);
            }
        })
        .catch(function(error) {
            console.log("Error getting login status: " + error);
        });
    }


    render() {

        return (
            <div>
                <CreateAccountForm action="/adduser" />
                <br />
                <br />
                <hr />
                <LoginForm action="/login" />
            </div>
        );
    }
}

class LogoutPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {notification: ""};
    }
    
    componentDidMount() {
        var me = this;
        fetch(this.props.action, {
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
            var notification;
            if (json.status === STATUS_OK) {
                notification = "You have successfully logged out.";
                // me.props.setLoginState()
                // me.setState({ notification: "You have successfully logged out." });
            }
            else {
                notification = "Could not logout. Error: " + json.error;
                // me.setState({ notification: "Could not logout. Error: " + json.error});
            }
            me.props.setLoginState(false, notification);
        })
        .catch(function(error) {
            console.log("Error getting logout: " + error);
            me.props.setLoginState(false, "Failed to logout.");
            // me.setState({notification: "Failed to logout."})
        });
    }

    render() {

        return (
            <div>
                <p className="Notification">{this.props.notification}</p>
            </div>
        );
    }

}

export { LoginPage, LogoutPage };
