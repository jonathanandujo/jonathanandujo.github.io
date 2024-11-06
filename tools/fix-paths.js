const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build');
const indexPath = path.join(buildDir, 'index.html');
const staticDir = path.join(buildDir, 'static');

function fixPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\/static\//g, 'static/');
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix paths in index.html
fixPaths(indexPath);

// Fix paths in all JavaScript files in the static directory
const jsFiles = fs.readdirSync(staticDir).filter(file => file.endsWith('.js'));
jsFiles.forEach(file => {
  fixPaths(path.join(staticDir, file));
});