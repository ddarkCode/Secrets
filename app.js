require( 'dotenv' ).config();
const express = require( 'express' );
const mongoose = require( 'mongoose' );
const ejs = require( 'ejs' );
const session = require( 'express-session' );
const passport = require( 'passport' );
const passportLocalMongoose = require( 'passport-local-mongoose' );

const app = express();


app.set( 'view engine', 'ejs' );
app.use( express.static( 'public' ) );
app.use( express.urlencoded( { extended: true } ) );
app.use( session( {
	secret: 'Our little secret.',
	resave: false,
	saveUninitialized: false
} ) )
app.use(passport.initialize())
app.use( passport.session() );




mongoose.connect( 'mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true } );
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema( {
	email: String,
	password: String
} )

userSchema.plugin( passportLocalMongoose );

const User = mongoose.model( 'User', userSchema );

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get( '/', ( req, res ) => {
	res.render( 'home' );
} )

app.get( '/login', ( req, res ) => {
	res.render( 'login' );
})

app.get( '/register', ( req, res ) => {
	res.render( 'register' );
} )

app.get( '/secrets', ( req, res ) => {
	if ( req.isAuthenticated() ) {
		res.render( 'secrets' );
	} else {
		res.redirect( '/login' );
	}
})

app.get( '/logout', function ( req, res ) {
	req.logout()
	res.redirect( '/' );
})

app.post( '/register', ( req, res ) => {
	const { username, password } = req.body;
	User.register( { username: username }, password, function ( err, user ) {
		if ( err ) {
			console.log( err );
			res.redirect( '/register' );
		} else {
			passport.authenticate( 'local' )( req, res, function () {
				res.redirect( '/secrets' );
			})
		}
	})
} )

app.post( '/login', ( req, res ) => {
	const { username, password } = req.body;

	const user = new User( {
		username: username,
		password: password
	})

	req.login( user, function ( err ) {
		if ( err ) {
			console.log( err );
		} else {
			passport.authenticate('local')( req, res, function () {
				res.redirect( '/secrets' );
			})
		}
	})
})


app.listen( 3000, () => console.log( 'Server is running on port 3000' ) );