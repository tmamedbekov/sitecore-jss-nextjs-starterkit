const fs = require('fs-extra');
const nodePath = require('path');

main();

function main() {
  const publishFolderPath = nodePath.resolve(__dirname, '../out-serverless');
  const nextFolderPath = nodePath.resolve(__dirname, '../.next');
  const publicFolderPath = nodePath.resolve(__dirname, '../public');
  const netlifyFunctionsFolderPath = nodePath.resolve(__dirname, '../functions');

  const nextFolderPublishPath = nodePath.join(publishFolderPath, '_next');
  const netlifyRouterFunctionPagesFolderPath = nodePath.join(
    netlifyFunctionsFolderPath,
    'router/pages'
  );
  const serverlessPagesFolderPath = nodePath.join(nextFolderPath, 'serverless/pages');
  const pagesIndexFilePath = nodePath.join(netlifyFunctionsFolderPath, 'router/pagesIndex.js');

  fs.ensureDirSync(publishFolderPath);
  fs.ensureDirSync(netlifyRouterFunctionPagesFolderPath);

  fs.emptyDirSync(publishFolderPath);
  fs.emptyDirSync(netlifyRouterFunctionPagesFolderPath);

  fs.copySync(nextFolderPath, nextFolderPublishPath);
  fs.copySync(publicFolderPath, publishFolderPath);
  fs.copySync(serverlessPagesFolderPath, netlifyRouterFunctionPagesFolderPath);

  const pageFiles = fs.readdirSync(netlifyRouterFunctionPagesFolderPath, { withFileTypes: true });
  const pagesIndexFileContents = pageFiles.reduce((result, pageFile) => {
    if (pageFile.isFile() && nodePath.extname(pageFile.name) === '.js') {
      const filenameWithoutExtension = nodePath.parse(pageFile.name).name;
      result += `require('./pages/${filenameWithoutExtension}');\n`;
    }
    return result;
  }, '');

  fs.writeFileSync(pagesIndexFilePath, pagesIndexFileContents);
}
