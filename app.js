require( 'dotenv' ).config();
const express = require( 'express' );
const mongoose = require( 'mongoose' );
const ejs = require( 'ejs' );
const md5 = require( 'md5' );
const bcrypt = require( 'bcrypt' );



const app = express();
const saltRounds = 10;

app.set( 'view engine', 'ejs' );
app.use( express.static( 'public' ) );
app.use( express.urlencoded( { extended: true } ) );

mongoose.connect( 'mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true} );

const userSchema = new mongoose.Schema( {
	email: String,
	password: String
} )

const User = mongoose.model( 'User', userSchema );

app.get( '/', ( req, res ) => {
	res.render( 'home' );
} )

app.get( '/login', ( req, res ) => {
	res.render( 'login' );
})

app.get( '/register', ( req, res ) => {
	res.render( 'register' );
} )

app.post( '/register', ( req, res ) => {
	const { username, password } = req.body;
	bcrypt.hash(password, saltRounds, function(err, hash) {
	// Store hash in your password DB.
		if ( !err ) {
			const newUser = new User( {
		email: username,
			password: hash
	} )
	
	newUser.save( ( err ) => {
		if ( err ) {
			console.log(err);
		} else {
			res.render( 'secrets' );
		}
	})
	}
});

	
} )

app.post( '/login', ( req, res ) => {
	const { username, password } = req.body;

	User.findOne( { email: username }, ( err, foundUser ) => {
		if ( err ) {
			console.log(err);
		} else {
			bcrypt.compare( password, foundUser.password, function ( err, result ) {
				if ( result ) {
				res.render( 'secrets' );
			}
    // result == true
});
		}
	})
})


app.listen( 3000, () => console.log( 'Server is running on port 3000' ) );