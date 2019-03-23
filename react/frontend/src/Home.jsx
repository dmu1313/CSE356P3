
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

import {Button} from './Button';

import './App.css';

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.postQuestion = this.postQuestion.bind(this);
    }

    postQuestion() {
        console.log("Posting question.");
        // Fetch request to post question
        this.props.history.push('/Home');
    }

    render() {
        var message;
        if (this.props.loggedIn) {
            message = <p>Logged In</p>;
        }
        else {
            message = <p>Logged Out</p>;
        }

        return (
            <div>
                <Button className="button ripple" callback={ this.postQuestion }>Post Question</Button>
                {message}
            </div>
        );
    }
}

export {Home};