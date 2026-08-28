import React from 'react'

import styles from './ExerciseRenderer.module.css'
//level1
import Association from '../exercises/level-1/association/Association'
import Description from '../exercises/level-1/description/Description'
import Emotion from '../exercises/level-1/emotion/Emotion'
import LogicChain from '../exercises/level-1/logic-chain/LogicChain'
import Synonyms from '../exercises/level-1/synonyms/Synonyms'
import TongueTwister from '../exercises/level-1/tongue-twister/TongueTwister'
//level2
import JargonTask from '../exercises/level-2/jargon-task/JargonTask'
import SpeakingThread from '../exercises/level-2/speaking-thread/SpeakingThread'
import ToastMaster from '../exercises/level-2/toast-master/ToastMaster'
import JokeMaster from '../exercises/level-2/joke-master/JokeMaster'
import Taboo from '../exercises/level-2/taboo/Taboo'
import ScienceTranslator from '../exercises/level-2/science-translator/ScienceTranslator'
import KingFailure from '../exercises/level-2/king-failure/KingFailure'
import FearExplosive from '../exercises/level-2/fear-explosive/FearExplosive'
//level 3
import DebateTrainerAi from '../exercises/level-3/debate-trainer-ai/DebateTrainerAi'
import InterviewAi from '../exercises/level-3/interview-ai/InterviewAi'
import IcebreakerAi from '../exercises/level-3/icebreaker-ai/IcebreakerAi'
import TribuneAi from '../exercises/level-3/tribune-ai/TribuneAi'
import AlibiAi from '../exercises/level-3/alibi-ai/AlibiAi'
import BargainAi from '../exercises/level-3/bargain-ai/BargainAi'
import KnockoutAi from '../exercises/level-3/knockout-ai/KnockoutAi'
import MetaphorAi from '../exercises/level-3/metaphor-ai/MetaphorAi'
import PoemTongueAi from '../exercises/level-3/poem-tongue-ai/PoemTongueAi'
import PoemActingAi from '../exercises/level-3/poem-acting-ai/PoemActingAi'
import StopWordAi from '../exercises/level-3/stop-word-ai/StopWordAi'
import PoemRapAi from '../exercises/level-3/poem-rap-ai/PoemRapAi'
import RadioHostAi from '../exercises/level-3/radio-host-ai/RadioHostAi'
import RandomWordAi from '../exercises/level-3/random-word-ai/RandomWordAi'
import HistoricalAi from '../exercises/level-3/historical-battle-ai/HistoricalAi'

const ExerciseRenderer = ({ exercise, isDaily }) => {
  // Определяем, какой компонент отрисовать на основе типа из конфига
  switch (exercise.alias) {
    case 'association':
      return <Association alias={exercise.alias} isDaily={isDaily} />
    case 'description':
      return <Description alias={exercise.alias} isDaily={isDaily} />
    case 'tongue-twister':
      return (
        <TongueTwister alias={exercise.alias} isDaily={isDaily} />
      )
    case 'synonyms': 
      return <Synonyms alias={exercise.alias} isDaily={isDaily} />
    case 'emotion':
      return <Emotion alias={exercise.alias} isDaily={isDaily} />
    case 'logic-chain':
      return <LogicChain alias={exercise.alias} isDaily={isDaily} />
    case 'jargon-task':
      return <JargonTask alias={exercise.alias} isDaily={isDaily} />
    case 'speaking-thread':
      return (
        <SpeakingThread alias={exercise.alias} isDaily={isDaily} />
      )
    case 'toast-master':
      return <ToastMaster alias={exercise.alias} isDaily={isDaily} />
    case 'joke-master':
      return <JokeMaster alias={exercise.alias} isDaily={isDaily} />
    case 'taboo':
      return <Taboo alias={exercise.alias} isDaily={isDaily} />
    case 'science-translator':
      return (
        <ScienceTranslator alias={exercise.alias} isDaily={isDaily} />
      )
    case 'fear-explosive':
      return (
        <FearExplosive alias={exercise.alias} isDaily={isDaily} />
      )
    case 'king-failure':
      return <KingFailure alias={exercise.alias} isDaily={isDaily} />
    case 'ai-debate':
      return (
        <DebateTrainerAi alias={exercise.alias} isDaily={isDaily} />
      )
    case 'ai-interview':
      return <InterviewAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-icebreaker':
      return <IcebreakerAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-tribune':
      return <TribuneAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-alibi':
      return <AlibiAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-bargain':
      return <BargainAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-knockout':
      return <KnockoutAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-metaphor':
      return <MetaphorAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-poem-tongue':
      return <PoemTongueAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-poem-acting':
      return <PoemActingAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-poem-rap':
      return <PoemRapAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-radio-host':
      return <RadioHostAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-stop-word':
      return <StopWordAi alias={exercise.alias} isDaily={isDaily} />
    case 'ai-random-word':
      return <RandomWordAi alias={exercise.alias} isDaily={isDaily} />
     case 'ai-historical-battle':
      return <HistoricalAi alias={exercise.alias} isDaily={isDaily} />

    default:
      return (
        <div className={styles.unknown_ex}>
          <span>Неизвестный тип упражнения</span>
        </div>
      )
  }
}

export default ExerciseRenderer
