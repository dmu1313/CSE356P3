import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

import {App} from './App.js';
import {NavBar} from './Navigation.js';
import {Home} from './Home';
import {LoginStatus} from './Routes';

import * as serviceWorker from './serviceWorker';

import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';

ReactDOM.render((
    <Router>
        <div>
            <LoginStatus />
        </div>
    </Router>
 ), document.getElementById('root'));


//ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
