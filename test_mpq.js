var mpq = require('mech-mpq');

function getFileContents(mpqPath, filePath) {
    var archive = mpq.openArchive(mpqPath);
    if (archive) {
        var file = archive.openFile(filePath);
        if (file) {
            var fileContents = file.read();
            file.close();
            return fileContents;
        }
    }
    return null;
}

var fileContents = getFileContents('./war3/1.27b/War3Patch.mpq', 'Scripts\\blizzard.j');

if (fileContents) {
    console.log(fileContents.length);
    console.log(fileContents);
}