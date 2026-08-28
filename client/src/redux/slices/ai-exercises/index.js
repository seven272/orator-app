import debateSlice from './debateSlice'
import interviewSlice from './interviewSlice'
import icebreakerSlice from './icebreakerSlice'
import tribuneSlice from './tribuneSlice'
import alibiSlice from './alibiSlice'
import bargainSlice from './bargainSlice'
import knockoutSlice from './knockoutSlice'
import metaphorSlice from './metaphorSlice'
import poemTongueSlice from './poemTongueSlice'
import poemActingSlice from './poemActingSlice'
import poemRapSlice from './poemRapSlice'
import radioHostSlice from './radioHostSlice'
import stopWordSlice from './stopWordSlice'
import randomWordSlice from './randomWordSlice'
import historicalSlice from './historicalSlice'

// Экспортируем единый объект со всеми ИИ-редюсерами
const aiSlices = {
  debate: debateSlice,
  interview: interviewSlice,
  icebreaker: icebreakerSlice,
  tribune: tribuneSlice,
  alibi: alibiSlice,
  bargain: bargainSlice,
  knockout: knockoutSlice,
  metaphor: metaphorSlice,
  poemTongue: poemTongueSlice,
  poemActing: poemActingSlice,
  poemRap: poemRapSlice,
  radioHost: radioHostSlice,
  stopWord: stopWordSlice,
  randomWord: randomWordSlice,
  historical: historicalSlice,
}

export default aiSlices
