const { readFileSync } = require('fs');
const { execSync } = require('child_process');

module.exports = {
  print(objects) {
    const blocks = []
    let idx = 0;
    for (const o of objects) {
      if (o.markdown) {
        blocks.push(o.markdown)
      } else if (o.example) {
        blocks.push(`## ${++idx}. ${o.example}
${o.desc || ''}
`);
        const files = typeof o.file == 'string' ? [o.file] : o.file
        files.forEach(f => {
          const content = readFileSync(f, 'utf8').split('\n').filter(p => p).join('\n')
          blocks.push(`
\`\`\`$ cat ${f}\`\`\`
\`\`\`yaml
${content.trim()}
\`\`\`
`)
        });
        const result = execSync(`pkt ${files[0]} ${o.option}`)
        blocks.push(`
\`\`\`$ pkt ${files[0]} ${o.option || ''}\`\`\`
\`\`\`yaml
${result.toString().split('\n').filter(p => p).join('\n')}
\`\`\`
        `)
      }
    }
    console.log(blocks.join('\n'));
  }
}
