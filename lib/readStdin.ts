export async function readStdin(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const chunks: any[] = [];

        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (chunk) {
            chunks.push(chunk);
        });
    
        process.stdin.on('end', function () {
            var all = chunks.join('');
            resolve(all);
        });

        process.stdin.on('error', function(error) {
            reject(error);
        })
    });
}
