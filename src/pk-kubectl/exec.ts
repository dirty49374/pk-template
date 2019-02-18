import { exec, execSync } from "child_process";

export const execPipeSync = (command: string, notFoundPattern?: string): string => {
    try {
        const opt: any = { stdio: ['pipe', 'pipe', 'pipe'] };
        const result = execSync(command, opt);
        const text = result.toString();
        return text;
    } catch (e) {
        if (notFoundPattern && e.message.includes(notFoundPattern)) {
            return '';
        }
        console.log(e.message);
        process.exit(1);
        throw new Error('impossible');
    }
}

export const execStdin = (command: string, input: string, cb: (data: any) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            const ps = exec(command);
            ps.stdin.write(input, e => {
                ps.stdin.end();
            });
            ps.stdout.on('data', (data) => cb(data));
            ps.stderr.on('data', (data) => cb(data));
            ps.on('close', code => {
                if (code == 0) {
                    resolve();
                }
                reject(new Error(`process exited with code = ${code}`));
            });
        } catch (e) {
            console.log(e.message);
            process.exit(1);
        }
    })
}
