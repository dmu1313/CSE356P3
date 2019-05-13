

import React from 'react';
import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS, QuestionLink} from './Utils';
import { Link, withRouter } from 'react-router-dom';

class UsersPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {notification: ""};
        this.handleChange = this.handleChange.bind(this);
        this.getUser = this.getUser.bind(this);
    }

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
    
    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        this.setState({ [name]: value });
    }

    getUser(e) {
        console.log("Get User");
        e.preventDefault();

        if (this.state.username == null || this.state.username === "") {
            return;
        }

        this.props.history.push('/User/' + this.state.username);
    }

    render() {
        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <p>Find a user by typing in their username.</p>

                <form className="" onSubmit={this.getUser}>
                    <label>
                        Username:
                        <input className={this.props.className} type="text" name="username" value={this.state.username} onChange={this.handleChange} />
                    </label>
                    <br />
                    <input className={BUTTON_CLASS} type="submit" value="Find User" />
                </form>
            </div>
        );
    }
}


class UserPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        var me = this;
        var username = this.props.match.params.username;

        var newState = {};

        this.props.getLoginStatus()
        .then(function(status) {
            if (status !== me.props.loggedIn) {
                me.props.setLoginState(status);
            }
        })
        .catch(function(error) {
            console.log("Error getting login status: " + error);
        });

        fetch('/user/' + username, {
            method: "GET",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache"
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                newState.email = json.user.email;
                newState.reputation = json.user.reputation;
            }
            else {
                me.setState({notification: "Unable to get user with username: " + username});
            }
            return fetch('/user/' + username + '/questions', {
                method: "GET",
                credentials: 'include',
                mode: "cors",
                cache: "no-cache"
            });
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                newState.questions = json.questions;
            }
            else {
                me.setState({notification: "Unable to get the questions of user: " + username});
            }
            return fetch('/user/' + username + '/answers', {
                method: "GET",
                credentials: 'include',
                mode: "cors",
                cache: "no-cache"
            });
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                newState.answers = json.answers;
            }
            else {
                me.setState({notification: "Unable to get the answers of user: " + username});
            }
        })
        .catch(function(error) {
            console.log("Failed to fetch part or all of user profile with username: " + username + ", Error: " + error);
        })
        .finally(function() {
            me.setState(newState);
        });
    }

    render() {

        var username = this.props.match.params.username;
        var userProfile;
        var userQuestionsDisplay;
        var userAnswersDisplay;

        var questions = this.state.questions;
        var answers = this.state.answers;

        if (this.state.email && this.state.reputation) {
            userProfile = (
                <div>
                    <p>Username: {username}</p>
                    <p>Reputation: {this.state.reputation}</p>
                    <p>Email: {this.state.email}</p>
                </div>
            );
        }
        else {
            userProfile = (
                <React.Fragment>
                </React.Fragment>
            );
        }


        if (questions != null && questions.length > 0) {
            userQuestionsDisplay = (
                <div>
                    {questions.map((questionId) => {
                                        return (
                                            <div>
                                                <QuestionLink id={questionId} to={'/Question/' + questionId} />
                                                <br />
                                            </div>
                                        );
                                        } )}
                </div>
            );
        }
        else {
            userQuestionsDisplay = (
                <React.Fragment>
                </React.Fragment>
            );
        }

        if (answers != null && answers.length > 0) {
            userAnswersDisplay = (
                <div>
                    {answers.map((answerId) => {
                                        return (
                                            <div>
                                                <p>{answerId}</p>
                                            </div>
                                        );
                                        } )}
                </div>
            );
        }
        else {
            userAnswersDisplay = (
                <React.Fragment>
                </React.Fragment>
            );
        }

        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <h1>User Profile</h1>
                <br />
                {userProfile}
                <br />
                <br />
                <p>Questions posted by user</p>
                {userQuestionsDisplay}
                <br />
                <br />
                <p>Answers posted by user</p>
                {userAnswersDisplay}
            </div>
        );
    }
}


const usersPage = withRouter(UsersPage);

export {usersPage, UserPage};
