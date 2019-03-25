

import React from 'react';
import { withRouter } from 'react-router-dom';

import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS} from './Utils';

class VerifyForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { email: "", key: "", notification: "" };

        this.handleChange = this.handleChange.bind(this);
        this.verifyAccount = this.verifyAccount.bind(this);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        this.setState({ [name]: value });
    }

    verifyAccount(e) {
        console.log("Verify Account");
        e.preventDefault();

        //fetch for creating account

        var sendObj = { email: this.state.email, key: this.state.key };

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
                me.props.history.push({
                    pathname: '/Verify',
                    state: { msg: "You have successfully verified a new account." }
                });
            }
            else if (json.status === STATUS_ERROR) {
                me.setState({ notification: ("Could not verify an account successfully. Try again please. Error: " + json.error) });
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
                <form className="" onSubmit={this.verifyAccount}>
                    <label>
                        Email:
                        <input className={this.props.className} type="text" name="email" value={this.state.email} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Key:
                        <input className={this.props.className} type="text" name="key" value={this.state.key} onChange={this.handleChange} />
                    </label>
                    <input className={BUTTON_CLASS} type="submit" value="Verify Account" />
                </form>
            </div>
        );
    }
}

class VerifyPage extends React.Component {
    render() {
        return (
            <div>
                <p className="Notification">{this.props.location.state.msg}</p>
            </div>
        );
    }
}


export { VerifyPage };
export default withRouter(VerifyForm);