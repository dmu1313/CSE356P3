
import React from 'react';
import { withRouter } from 'react-router-dom';

import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS} from './Utils';

class LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { username: "", password: "", notification: "" };

        this.handleChange = this.handleChange.bind(this);
        this.login = this.login.bind(this);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        this.setState({ [name]: value });
    }

    login(e) {
        console.log("Log in");
        e.preventDefault();

        //fetch for logging in
        var sendObj = { username: this.state.username, password: this.state.password };
        
        var me = this;

        fetch(this.props.action, {
            method: "POST",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sendObj)
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                me.props.history.push('/Home');
            }
            else if (json.status === STATUS_ERROR) {
                me.setState({ notification: ("Could not login successfully. Try again please. Error: " + json.error) });
            }
            else {
                console.log("Unkown error: " + json.error);
            }
        });
    }

    render() {
        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <form className="" onSubmit={this.login}>
                    <label>
                        Username:
                        <input className={this.props.className} type="text" name="username" value={this.state.username} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Password:
                        <input className={this.props.className} type="text" name="password" value={this.state.password} onChange={this.handleChange} />
                    </label>
                    <input className={BUTTON_CLASS} type="submit" value="Login" />
                </form>
            </div>
        );
    }
}

export default withRouter(LoginForm);
