
import React from 'react';
import { withRouter } from 'react-router-dom';

import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS} from './Utils';


class CreateAccountForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { username: "", email: "", password: "", notification: "" };

        this.handleChange = this.handleChange.bind(this);
        this.createAccount = this.createAccount.bind(this);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        this.setState({ [name]: value });
    }

    createAccount(e) {
        console.log("Create New Account");
        e.preventDefault();

        //fetch for creating account

        var sendObj = { username: this.state.username, email: this.state.email, password: this.state.password };

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
            console.log(response);
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                me.props.history.push({
                    pathname: '/NewAccount',
                    state: { msg: "You have successfully created a new account." }
                });
            }
            else if (json.status === STATUS_ERROR) {
                me.setState({ notification: ("Could not create an account successfully. Try again please. Error: " + json.error) });
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
                <form className="" onSubmit={this.createAccount}>
                    <label>
                        Username:
                        <input className={this.props.className} type="text" name="username" value={this.state.username} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Email:
                        <input className={this.props.className} type="email" name="email" value={this.state.email} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Password:
                        <input className={this.props.className} type="text" name="password" value={this.state.password} onChange={this.handleChange} />
                    </label>
                    <input className={BUTTON_CLASS} type="submit" value="Create Account" />
                </form>
            </div>
        );
    }
}


class SuccessNewAccountPage extends React.Component {
    render() {
        return (
            <div>
                <p className="Notification">{this.props.location.state.msg}</p>
            </div>
        );
    }
}

export { SuccessNewAccountPage };
export default withRouter(CreateAccountForm);