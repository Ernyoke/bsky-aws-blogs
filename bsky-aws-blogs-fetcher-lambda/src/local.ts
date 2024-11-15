import {handler} from "./index.js";
import {Context} from 'aws-lambda';

await handler({}, {} as Context, () => {
    console.log("Finished");
});
