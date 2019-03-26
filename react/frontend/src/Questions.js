

import React from 'react';
import { withRouter } from 'react-router-dom';

import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS} from './Utils';


class AddQuestionForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {notification: ""};
        this.handleChange = this.handleChange.bind(this);
        this.addQuestion = this.addQuestion.bind(this);
    }

    
    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        this.setState({ [name]: value });
    }

    addQuestion(e) {
        console.log("Add question");
        e.preventDefault();

        var tagsArray = this.state.tags.split(" ");
        
        var sendObj = { title: this.state.title, body: this.state.body, tags: tagsArray };

        var me = this;
        var success = false;
        var questionId = "";

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
                success = true;
                questionId = json.id;
            }
            else {
                success = false;
                me.setState({ notification: ("Could not add question. Try again please. Error: " + json.error) });
            }
        })
        .catch(function(error) {
            success = false;
            console.log("Catch: Failed to add question. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.props.history.push('/Question/' + questionId);
            }
            else {
                me.setState({notification: "Could not add question."})
            }
        });

    }

    render() {
        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <form className="" onSubmit={this.addQuestion}>
                    <label>
                        Title:
                        <input className={this.props.className} type="text" name="title" value={this.state.title} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Body:
                        <textarea className={this.props.className} name="body" value={this.state.body} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Tags:
                        <input className={this.props.className} type="text" name="tags" value={this.state.tags} onChange={this.handleChange} />
                    </label>
                    <br />
                    <input className={BUTTON_CLASS} type="submit" value="Add Question" />
                </form>
            </div>
        );
    }
}




class QuestionPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {id: 0, user: null, title:"", body:"", score:0, view_count:0, answer_count:0, timestamp:0,
                        media:null, tags:null, accepted_answer_id:null};


        this.answerAdded = this.answerAdded.bind(this);
    }

    answerAdded() {
        this.setState(this.state);
    }

    componentDidMount() {
        var questionId = this.props.match.params.id;

        var me = this;
        fetch('/questions/' + questionId, {
            method: "GET",
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
            if (json.error == null) {
                console.log("JSON.question: " + json.question);
                me.setState(json.question);
            }
            else {
                me.setState({errorMessage: json.error});
            }
        })
        .catch(function(error) {
            console.log("Failed to get question: " + error);
            return false;
        });
    }


    render() {
        console.log(this.state);
        if (this.state.id !== 0) {
            return (
                <div>
                    <p>Question ID: {this.state.id}</p>
                    <p>Title: {this.state.title}</p>
                    <br />
                    <p>{this.state.body}</p>
                    <br />
                    <p>Score: {this.state.score}</p>
                    <p>Views: {this.state.view_count}</p>
                    <p>Posted by: {this.state.user.username}</p>
                    <p>Reputation: {this.state.user.reputation}</p>
                    <p>Time Posted: {this.state.timestamp}</p>
                    {/* <p>Media: {this.state.media}</p> */}
                    <p>Tags: {this.state.tags}</p>
                    <p>Accepted Answer ID: {this.state.accepted_answer_id}</p>
                    <br />
                    <br />
                    <p>Number of answers: {this.state.answer_count}</p>

                    <br />
                    <hr />

                    <p>Add answer: </p>
                    <AddAnswerForm action={"/questions/" + this.props.match.params.id + "/answers/add"} callback={this.answerAdded} />

                    <br />
                    <hr />

                    <Answers questionId={this.props.match.params.id} />

                </div>
            );
        }
        else if (this.state.errorMessage != null) {
            return (
                <div>
                    <p className="Notification">{this.state.errorMessage}</p>
                </div>
            );
        }
        else {
            console.log("Hi");
            return (
                <div></div>
            );
        }
    }
}

class Answers extends React.Component {
    constructor(props) {
        super(props);
        this.state= {notification: ""};
    }

    componentDidMount() {
        var success = false;
        var answers;
        var me = this;
        
        let questionId = this.props.questionId;

        fetch("/questions/" + questionId + "/answers", {
            method: "GET",
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
            console.log("Getting answers");
            if (json.status === STATUS_OK) {
                success = true;
                answers = json.answers;
                console.log("Answers: " + answers);
            }
            else {
                success = false;
                // me.setState({ notification: ("Could not get answers for questionId: " + questionId + ". Error: " + json.error) });
            }
        })
        .catch(function(error) {
            success = false;
            console.log("Catch: Failed to get answers. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.setState({answers: answers});
            }
            else {
                me.setState({notification: "No answers to show."})
            }
        });
    }

    componentDidUpdate() {
        var success = false;
        var answers;
        var me = this;
        
        let questionId = this.props.questionId;

        fetch("/questions/" + questionId + "/answers", {
            method: "GET",
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
            console.log("Getting answers");
            if (json.status === STATUS_OK) {
                success = true;
                answers = json.answers;
                console.log("Answers: " + answers);
            }
            else {
                success = false;
                // me.setState({ notification: ("Could not get answers for questionId: " + questionId + ". Error: " + json.error) });
            }
        })
        .catch(function(error) {
            success = false;
            console.log("Catch: Failed to get answers. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.setState({answers: answers});
            }
            else {
                me.setState({notification: "No answers to show."})
            }
        });
    }

    render() {
        if (this.state.answers) {
            return (
                <div>
                    <p className="Notification">{this.state.notification}</p>
                    {this.state.answers.map((answer) => {
                                        return (
                                            <React.Fragment>
                                            <Answer id={answer.id} body={answer.body} user={answer.user}
                                            score={answer.score} is_accepted={answer.is_accepted} timestamp={answer.timestamp} />
                                            <br />
                                            <hr />
                                            </React.Fragment>
                                        );
                                        } )}
                </div>
            );
        }
        else {
            return (
                <div>
                    <p className="Notification">{this.state.notification}</p>
                </div>
            );
        }
    }
}

class Answer extends React.Component {
    render() {
        return(
            <div>
                <p>{this.props.body}</p>
                <p>Answer ID: {this.props.id}</p>
                <p>Username: {this.props.user}</p>
                <p>Score: {this.props.score}</p>
                <p>Accepted: {this.props.is_accepted}</p>
                <p>Timestamp: {this.props.timestamp}</p>
                {/* <p>Media: {this.props.media}</p> */}
            </div>
        );
    }
}



class AddAnswerForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {body:""};

        this.handleChange = this.handleChange.bind(this);
        this.addAnswer = this.addAnswer.bind(this);
    }
    
    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        this.setState({ [name]: value });
    }

    addAnswer(e) {
        console.log("Add answer");
        e.preventDefault();
        
        var sendObj = { body: this.state.body };

        var me = this;
        var success = false;
        var answerId = "";

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
                success = true;
                answerId = json.id;
            }
            else {
                success = false;
            }
        })
        .catch(function(error) {
            success = false;
            console.log("Catch: Failed to add answer. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.props.callback();
            }
            else {
                me.setState({notification: "Could not add answer."})
            }
        });

    }

    render() {
        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <form className="" onSubmit={this.addAnswer}>
                    <label>
                        Answer:
                        <textarea className={this.props.className} name="body" value={this.state.body} onChange={this.handleChange} />
                    </label>
                    <br />
                    <input className={BUTTON_CLASS} type="submit" value="Add Answer" />
                </form>
            </div>
        );
    }
}

const addQuestionForm = withRouter(AddQuestionForm);


export {QuestionPage, addQuestionForm};
