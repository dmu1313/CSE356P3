
import React from 'react';

import LoginForm from './Login';
import CreateAccountForm from './Accounts';

class LoginPage extends React.Component {
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

export { LoginPage };
