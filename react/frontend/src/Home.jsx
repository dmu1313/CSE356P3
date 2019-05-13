
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

import {Button} from './Button';

import './App.css';

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.postQuestion = this.postQuestion.bind(this);
        this.state = {};
    }

    postQuestion() {
        console.log("Posting question.");
        // Fetch request to post question
        this.props.history.push('/Home');
    }
    
    componentDidMount() {
        console.log("DID MOUNT IN HOME");
        // var me = this;
        // this.props.getLoginStatus()
        // .then(function(status) {
        //     if (status !== me.props.loggedIn) {
        //         me.props.setLoginState(status);
        //     }
        // })
        // .catch(function(error) {
        //     console.log("Error getting login status: " + error);
        // });
    }

    render() {
        var skip = false;
        if (this.props.location.state != null) {
            skip = this.props.location.state.skipFirstRender;
            this.props.location.state.skipFirstRender = false;
            this.props.location.state = null;
        }

        if (skip) {
            return(
                <div></div>
            );
        }

        var status = this.props.loggedIn;
        var message;
        // if (this.props.loggedIn) {
        if (status) {
            message = <p>Logged In</p>;
        }
        else {
            message = <p>Logged Out</p>;
        }

        return (
            <div>
                <h1>Welcome to my StackOverflow clone called ArrayOutOfBounds!</h1>
            </div>
        );
    }
}

export {Home};