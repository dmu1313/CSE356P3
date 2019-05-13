

import React from 'react';
import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS} from './Utils';

class MediaPage extends React.Component {
    constructor(props) {
        super(props);
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

    render() {
        return (
            <div>
                <AddMediaForm action={this.props.action} />
            </div>
        );
    }
}


class AddMediaForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {notification: ""};
        this.handleChange = this.handleChange.bind(this);
        this.addMedia = this.addMedia.bind(this);
    }

    
    handleChange(event) {
        let files = event.target.files;
        this.setState({ file: files[0] });
    }

    addMedia(e) {
        console.log("Add media");
        e.preventDefault();

        var formData = new FormData();

        formData.append('content', this.state.file);
        
        var me = this;
        var success = false;
        var mediaId;

        fetch(this.props.action, {
            method: "POST",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache",
            // headers: {
            //     "Content-Type": "multipart/form-data"
            // },
            body: formData
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                success = true;
                mediaId = json.id;
                me.setState({notification: ("Added media with ID: " + mediaId) });
            }
            else {
                success = false;
                me.setState({ notification: ("Could not add media. Try again please. Error: " + json.error) });
            }
        })
        .catch(function(error) {
            success = false;
            console.log("Failed to add media. Error: " + error);
        });

    }

    render() {
        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <form className="" onSubmit={this.addMedia}>
                    <label>
                        Media:
                        <input type="file" onChange={this.handleChange} />
                    </label>
                    <br />
                    <input className={BUTTON_CLASS} type="submit" value="Upload Media" />
                </form>
            </div>
        );
    }
}

export {MediaPage};