const express = require('express');
const path = require('node:path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

for (const directory of ['CSS', 'JS', 'assets']) {
  app.use(`/${directory}`, express.static(path.join(__dirname, directory)));
}

const pages = [
  { route: '/', view: 'index', title: 'Catalysta | Business Consultancy', activePage: 'home' },
  { route: '/about', view: 'about', title: 'About Us - Catalysta Consultancy', activePage: 'about' },
  { route: '/services', view: 'services', title: 'Services | Catalysta Business Consultancy Firm', activePage: 'services' },
  { route: '/blogs', view: 'blogs', title: 'Blogs | Catalysta', activePage: 'blogs' },
  { route: '/contact', view: 'contact', title: 'Contact | Catalysta', activePage: 'contact' },
];

for (const page of pages) {
  app.get(page.route, (request, response) => {
    response.render(page.view, page);
  });
}

app.use((request, response) => {
  response.status(404).send('Page not found');
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Catalysta Consultancy is listening on port ${port}`);
  });
}

module.exports = app;
