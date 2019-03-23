
import React from 'react';
import {Route} from 'react-router-dom';


import {App} from './App';
import {Home} from './Home';
import {NavBar} from './Navigation';

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
                this.props.history.push({
                    pathname: '/NewAccount',
                    state: { msg: "You have successfully created a new account." }
                });
            }
            else if (json.status === STATUS_ERROR) {
                this.setState({ notification: ("Could not create an account successfully. Try again please. Error: " + json.error) });
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

class SuccessNewAccountPage {
    render() {
        return (
            <div>
                <p className="Notification">{this.props.location.state.msg}</p>
            </div>
        );
    }
}

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
                this.props.history.push('/Home');
            }
            else if (json.status === STATUS_ERROR) {
                this.setState({ notification: ("Could not login successfully. Try again please. Error: " + json.error) });
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

class LogoutForm extends React.Component {
    constructor(props) {
        super(props);
        this.logout = this.logout.bind(this);
    }

    logout(e) {
        console.log("Logging Out");
        e.preventDefault();

        var sendObj = { username: this.state.username, email: this.state.email, password: this.state.password };

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
            if (json.status == "OK") {
                this.props.history.push({
                    pathname: '/NewAccount',
                    state: { msg: "You have successfully created a new account." }
                });
            }
            else if (json.status == "error") {
                this.setState({ notification: ("Could not create an account successfully. Try again please. Error: " + json.error) });
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
                <form className="SearchForm" onSubmit={this.createAccount}>
                    <label>
                        Username:
                        <input className={this.props.className} type="text" name="username" value={this.state.username} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        <input className={this.props.className} type="email" name="email" value={this.state.email} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        <input className={this.props.className} type="text" name="password" value={this.state.password} onChange={this.handleChange} />
                    </label>
                    <input className="button SearchButton" type="submit" value="Create Account" />
                </form>
            </div>
        );
    }
}

class LoginPage extends React.Component {

}

class LogoutPage extends React.Component {

}

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

        if (this.state.loggedIn != status) {
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
            <Route path="/search" render={ (props) => <Home {...props} loggedIn={status} /> } />
            <Route path="/NewAccount" component={SuccessNewAccountPage} />
            <Route path="/AddQuestion" />
            <Route path="/Question/:id" />
            <Route path="/Search" />
        </React.Fragment>
        );
    }
}

export {LoginStatus};