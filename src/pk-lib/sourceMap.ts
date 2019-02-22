export const extractSourceMap = (src: string): any => {
    const match = src.match(/\/\/# sourceMappingURL=.*;base64,ey/);
    if (match !== null && match.index) {
        const start = match.index + match[0].length - 2;
        const data = src.substr(start);
        const buff = Buffer.from(data, 'base64');
        const text = buff.toString('utf8');
        return JSON.parse(text);
    }
    return null;
}
