//level 1
import { wordZoomTheory } from './level1/word-zoom/theory'
import { associationTheory } from './level1/assosiation/theory'
import { descriptionTheory } from './level1/description/theory'
import { tongueTwisterTheory } from './level1/tongue-twister/theory'
import { logicChainTheory } from './level1/logic-chain/theory'
import { synonymsTheory } from './level1/synonyms/theory'
import { emotionTheory } from './level1/emotion/theory'
import { speechPaceTheory } from './level1/speech-pace/theory'
//level 2
import { jargonTaskTheory } from './level2/jargon-task/theory'
import { speakingThreadTheory } from './level2/speaking-thread/theory'
import { toastMasterTheory } from './level2/toast-master/theory'
import { jokeMasterTheory } from './level2/joke-master/theory'
import { tabooTheory } from './level2/taboo/theory'
import { scienceTranslatorTheory } from './level2/science-translator/theory'
import { fearExplosiveTheory } from './level2/fear-explosive/theory'
import { kingFailureTheory } from './level2/king-failure/theory'
import { argumentSpeedTheory } from './level2/argument-speed/theory'
//level 3
import { aiDebateTheory } from './level3/ai-debate/theory'
import { aiInterviewTheory } from './level3/ai-interview/theory'
import { aiIcebreakerTheory } from './level3/ai-icebreaker/theory'
import { aiTribuneTheory } from './level3/ai-tribune/theory'
import { aiAlibiTheory } from './level3/ai-alibi/theory'
import { aiBargainTheory } from './level3/ai-bargain/theory'
import { aiKnockoutTheory } from './level3/ai-knockout/theory'
import { aiMetaphorTheory } from './level3/ai-metaphor/theory'
import { aiPoemTongueTheory } from './level3/ai-poem-tongue/theory'
import { aiPoemActingTheory } from './level3/ai-poem-acting/theory'
import { aiPoemRapTheory } from './level3/ai-poem-rap/theory'
import { aiRadioHostTheory } from './level3/ai-radio-host/theory'
import { aiStopWordTheory } from './level3/ai-stop-word/theory'
import { aiRandomWordTheory } from './level3/ai-random-word/theory'
import { aiHistoricalBattleTheory } from './level3/ai-historical-battle/theory'

const THEORY_DATA = {
  // level 1
  'word-zoom': wordZoomTheory,
  association: associationTheory,
  description: descriptionTheory,
  'logic-chain': logicChainTheory,
  'tongue-twister': tongueTwisterTheory,
  synonyms: synonymsTheory,
  emotion: emotionTheory,
  'speech-pace': speechPaceTheory,

  // level 2
  'jargon-task': jargonTaskTheory,
  'speaking-thread': speakingThreadTheory,
  'toast-master': toastMasterTheory,
  'joke-master': jokeMasterTheory,
  taboo: tabooTheory,
  'science-translator': scienceTranslatorTheory,
  'fear-explosive': fearExplosiveTheory,
  'king-failure': kingFailureTheory,
  'argument-speed': argumentSpeedTheory,

  //level 3
  'ai-debate': aiDebateTheory,
  'ai-interview': aiInterviewTheory,
  'ai-icebreaker': aiIcebreakerTheory,
  'ai-tribune': aiTribuneTheory,
  'ai-alibi': aiAlibiTheory,
  'ai-bargain': aiBargainTheory,
  'ai-knockout': aiKnockoutTheory,
  'ai-metaphor': aiMetaphorTheory,
  'ai-poem-tongue': aiPoemTongueTheory,
  'ai-poem-acting': aiPoemActingTheory,
  'ai-poem-rap': aiPoemRapTheory,
  'ai-radio-host': aiRadioHostTheory,
  'ai-stop-word': aiStopWordTheory,
  'ai-random-word': aiRandomWordTheory,
  'ai-historical-battle': aiHistoricalBattleTheory,
}

export { THEORY_DATA }
