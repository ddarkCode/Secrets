require( 'dotenv' ).config();
const express = require( 'express' );
const mongoose = require( 'mongoose' );
const ejs = require( 'ejs' );
const encrypt = require( 'mongoose-encryption' );



const app = express();

app.set( 'view engine', 'ejs' );
app.use( express.static( 'public' ) );
app.use( express.urlencoded( { extended: true } ) );

mongoose.connect( 'mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true} );

const userSchema = new mongoose.Schema( {
	email: String,
	password: String
} )

userSchema.plugin( encrypt, { secret: process.env.SECRET, encryptedFields: [ 'password' ] } );

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

	const newUser = new User( {
		email: username,
		password: password
	} )
	
	newUser.save( ( err, rawDoc ) => {
		if ( err ) {
			console.log(err);
		} else {
			res.render( 'secrets' );
		}
	})
} )

app.post( '/login', ( req, res ) => {
	const { username, password } = req.body;

	User.findOne( { email: username }, ( err, foundUser ) => {
		if ( err ) {
			console.log(err);
		} else {
			if ( foundUser.password === password ) {
				res.render( 'secrets' );
			}
		}
	})
})


app.listen( 3000, () => console.log( 'Server is running on port 3000' ) );