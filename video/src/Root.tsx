import {Composition} from 'remotion';
import {EvacuationVideo} from './EvacuationVideo';
import {TOTAL_LEN} from './timing';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NanseiEvacuation"
        component={EvacuationVideo}
        durationInFrames={TOTAL_LEN}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
