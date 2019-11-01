'use strict';

const unleash = require('unleash-server');
const passport = require('@passport-next/passport');
const GoogleOAuth2Strategy = require('@passport-next/passport-google-oauth2');
const { googleClientId, googleClientSecret, googleCallbackUrl, nodeEnv } = require('./config');
const fs = require("fs");

passport.use(
  new GoogleOAuth2Strategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl,
    },
    (accessToken, refreshToken, profile, cb) => {
      cb(
        null,
        new unleash.User({
          name: profile.displayName,
          email: profile.emails[0].value,
        }),
      );
    },
  ),
);

function googleAdminAuth(app) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.get(
    '/api/admin/login',
    passport.authenticate('google', { scope: ['email'] }),
  );
  app.get(
    '/api/auth/callback',
    passport.authenticate('google', {
      failureRedirect: '/api/admin/error-login',
    }),
    (req, res) => {
      res.redirect('/');
    },
  );

  app.use('/api/admin/', (req, res, next) => {
    if (req.user) {
      next();
    } else {
      return res
        .status('401')
        .json(
          new unleash.AuthenticationRequired({
            path: '/api/admin/login',
            type: 'custom',
            message: `You have to identify yourself in order to use Unleash. Click the button and follow the instructions.`,
          }),
        )
        .end();
    }
  });
}

const options = {
  enableLegacyRoutes: false,
  adminAuthentication: 'custom',
  preRouterHook: googleAdminAuth,
};

unleash.start(options)
  .then(async ({ stateService }) => {
    if (nodeEnv == 'development') {
      const exportedData = await stateService.export({includeStrategies: false, includeFeatureToggles: true});
      await stateService.import({data: exportedData, userName: 'import', dropBeforeImport: false});

      if (fs.existsSync('exported-data.json')) {
        await stateService.importFile({file: 'exported-data.json', userName: 'import', dropBeforeImport: false});
      };
    };
  });
