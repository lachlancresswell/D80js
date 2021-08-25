# D80js

Control d&b audiotechnik D80 amplifiers over the OCA network with a Node.js environment.

## Example
```javascript
import * as D80 from './d80js';

// Pull OCA tree from amp
tree = await D80.getOcaTree('192.168.1.1');

// Mute and unmute all amp channels
for(let ch = 0; ch < 4; ch ++) await D80.setMuteStatus(tree, ch, true);
for(let ch = 0; ch < 4; ch ++) await D80.setMuteStatus(tree, ch, false);
```


## Thanks
All the heavy lifting done by - [DeutscheSoft/AES70.js: A controller library implementing the AES70 standard](https://github.com/DeutscheSoft/AES70.js/)