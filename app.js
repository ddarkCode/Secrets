require( 'dotenv' ).config();
const express = require( 'express' );
const ejs = require( 'ejs' );
const mongoose = require( 'mongoose' );
const session = require( 'express-session' )
const passport = require( 'passport' );
const passportLocalMongoose = require( 'passport-local-mongoose' );
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const FacebookStrategy = require( 'passport-facebook' );
const findOrCreate = require( 'mongoose-findorcreate' );


const app = express();

mongoose.connect( `mongodb+srv://admin-ugoh:${process.env.DATABASE_PASSWORD}@cluster0.lirx1.mongodb.net/usersDB`, { useNewUrlParser: true, useUnifiedTopology: true } );

app.set( 'view engine', 'ejs' );
app.use( express.static( 'public' ) );
app.use( express.urlencoded( { extended: true } ) );
app.use( session( {
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false
}))
app.use( passport.initialize() );
app.use( passport.session() );

const userSchema = new mongoose.Schema( {
	username: String,
	password: String,
	secret: Array,
	googleId: String,
	facebookId: String
} );

userSchema.plugin( passportLocalMongoose );
userSchema.plugin( findOrCreate );

const User = mongoose.model( 'User', userSchema );

passport.use( User.createStrategy() );


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
) );

passport.use( new FacebookStrategy( {
	clientID: process.env.FACEBOOK_APP_ID,
	clientSecret: process.env.FACEBOOK_APP_SECRET,
	callbackURL: 'http://localhost:3000.auth/facebook.secrets'
},
	 function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
) )

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
} );



app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
	} );
  
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get( '/', ( req, res ) => {
	res.render( 'home' );
} )

app.get( '/register', ( req, res ) => {
	res.render( 'register' );
} )

app.get( '/login', ( req, res ) => {
	res.render( 'login' );
} )

app.get( '/secrets', ( req, res ) => {
	User.find( { 'secret': { $ne: null } }, ( err, foundUsers ) => {
		if ( err ) {
			console.log( err );
		} else {
			if ( foundUsers ) {
				res.render('secrets', {usersWithSecrets: foundUsers})
			}
		}
	})
	
})

app.get( '/submit', ( req, res ) => {
	if ( req.isAuthenticated() ) {
		res.render( 'submit' );
	} else {
		res.redirect( '/login' );
	}
})

app.get( '/logout', ( req, res ) => {
    req.logout();
    res.redirect('/');

})

app.post( '/register', ( req, res ) => {
	const { username, password } = req.body;
	User.register( { username: username }, password, ( err, user ) => {
		if ( err ) {
			console.log( err );
			res.redirect( '/register' );
		} else {
			passport.authenticate( 'local' )( req, res, () => {
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
	} );

	req.login(user, function(err) {
		if ( err ) { 
			console.log( err );
			res.redirect( '/login' );
		} else {
			passport.authenticate( 'local' )( req, res, () => {
				res.redirect('/secrets')
			})
			}
});

} )

app.post( '/submit', ( req, res ) => {
	const { secret } = req.body;
	User.findById( req.user._id, ( err, foundUser ) => {
		if ( err ) {
			console.log( err );
			res.redirect('/')
		} else {
			if ( foundUser ) {
				foundUser.secret.push( secret );
				foundUser.save( (err) => {
					if ( err ) {
						console.log( err );
					} else {
						res.redirect( '/secrets' );
					}
				})
			}
		}
	})

})


app.listen( 3000, () => console.log( 'Server is running on port 3000' ) );