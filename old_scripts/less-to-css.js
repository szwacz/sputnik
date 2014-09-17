var fs = require('fs');
var less = require('less');

function run(from, to) {
    process.stdout.write('LESS to CSS ' + from + ' -> ' + to);
    
    var srcContent = fs.readFileSync(from, 'utf8');
    less.render(srcContent, function (err, css) {
        if (!err) {
            try {
                fs.writeFileSync(to, css);
                console.log(' - OK');
            } catch (e) {
                err = e;
            }
        }
        if (err) {
            console.log(' - ERROR');
            console.log(err);
        }
    });
}

run('../src/less/main.less', '../app/visual/css/main.css');