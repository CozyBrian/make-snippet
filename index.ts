import fs from 'node:fs';
import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';

interface Timestamp {
    time: string;
    label: string;
}

function parseTimestampFile(filePath: string): Timestamp[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    return lines.map(line => {
        const [time, ...labelParts] = line.split(' ');
        return { time: `00:${time}`, label: labelParts.join(' ').replaceAll(" ", "-").replaceAll(`"`, "") };
    });
}

function timeToSeconds(time: string): number {
    const [hours, minutes, seconds] = time.split(':').map(parseFloat);
    return (hours * 3600) + (minutes * 60) + seconds;
}

async function createSnippet(inputFilePath: string, outputFilePath: string, startTime: string, duration: number, callback: () => void) {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(inputFilePath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputFilePath)
        .on('end', () => {
          console.log(`Created snippet: ${outputFilePath}`);
          callback();
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error creating snippet: ${err.message}`);
          reject(err);
        })
        .run();
    });
}

async function main(audioFilePath: string, timestampFilePath: string) {
    const timestamps = parseTimestampFile(timestampFilePath);
    console.log(timestamps[10])
    for (let i = 0; i < timestamps.length; i++) {
        console.log(`Creating snippet ${i + 1} - ${timestamps[i].label}`)
        const startTime = timestamps[i].time;
        const endTime = i < timestamps.length - 1 ? timestamps[i + 1].time : null;
        const duration = endTime ? timeToSeconds(endTime) - timeToSeconds(startTime) : 1;
      
        const outputFilePath = path.join(__dirname, `/output/${timestamps[i].label}.mp3`);
        await createSnippet(audioFilePath, outputFilePath, startTime, duration, () => {});
    }
}

const audioFilePath = './input.mp4';
const timestampFilePath = './timestamps.txt';

main(audioFilePath, timestampFilePath);
