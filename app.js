import express from 'express';
import nunjucks from 'nunjucks';
import morgan from 'morgan';
import session from 'express-session';
import users from './users.json' assert { type: 'json' };
import stuffedAnimalData from './stuffed-animal-data.json' assert { type: 'json' };

const app = express();
const port = '8000';

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: false }));

nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

function getAnimalDetails(animalId) {
  return stuffedAnimalData[animalId];
}

app.get('/', (req, res) => {
  res.render('index.html');
});

app.get('/all-animals', (req, res) => {
  res.render('all-animals.html.njk', { animals: Object.values(stuffedAnimalData) });
});

app.get('/animal-details/:animalId', (req, res) => {
  let animalId= getAnimalDetails(req.params.animalId);
  res.render('animal-details.html.njk', { animal: animalId });
});

app.get('/add-to-cart/:animalId', (req, res) => {
  let animalId = req.params.animalId
  let sessionCart = req.session;
  if(!sessionCart.hasOwnProperty('cart')){
    sessionCart.cart = {};
  }
  if(!(animalId in sessionCart.cart)){
    sessionCart.cart[animalId] = 0 
  } 
    sessionCart.cart[animalId] += 1
    res.redirect('/cart')

});

app.get('/cart', (req, res) => {
  // TODO: Display the contents of the shopping cart.
  const username = req.session.username;
  let cart = req.session.cart;
  let animalArray = [];
  let totalCost = 0;


  for(let animal in cart){
    const details = getAnimalDetails(animal)
    const qty = cart[animal]
    const subtotal = qty * details.price
    details.qty = qty
    details.subtotal = subtotal

    totalCost += subtotal
    animalArray.push(details);
  }

  res.render('cart.html.njk', {animals: animalArray, totalCost: totalCost, username: username});
});

app.get('/checkout', (req, res) => {
  // Empty the cart.
  req.session.cart = {};
  res.redirect('/all-animals');
});

app.get('/login', (req, res) => {
  res.render('login.html.njk');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if(err){
          console.log(err);
      }
      res.redirect('/')
  })
})

app.post('/process-login', (req, res) => {
  req.session.username = req.body.username;
  req.session.password = req.body.password;

  const userIdx = users.find(({ username }) => username === req.session.username);
  if(userIdx.password === req.session.password){
    res.redirect('/all-animals');
  }
  else {
    res.send(`No account with username ${req.session.username} or password doesn't match`)
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}...`);
});
