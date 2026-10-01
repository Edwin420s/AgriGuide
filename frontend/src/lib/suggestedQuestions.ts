export interface SuggestedQuestion {
  id: string;
  label: string;
  fullQuery: string;
}

export interface QuestionContext {
  decision?: any;
  field?: any;
  state?: any;
  decisions?: any[];
  language?: string;
}

export function getDynamicSuggestedQuestions({
  decision,
  field,
  state,
  decisions = [],
  language = 'en'
}: QuestionContext): SuggestedQuestion[] {
  const isSwahili = language === 'sw';
  const rec = (decision?.recommendation || '').toUpperCase();
  const crop = field?.crop || 'crop';
  const soilMoisture = state?.soil_moisture ?? 17.5;
  const temp = state?.temperature ?? 24.5;
  const rainProb = state?.rain_probability_24h ?? 15;
  const hasSuperseded = decisions.some((d) => d.supersedes_id) || Boolean(decision?.supersedes_id);

  if (rec === 'WAIT') {
    if (isSwahili) {
      return [
        {
          id: 'wait-why',
          label: '"Kwa nini kusubiri?"',
          fullQuery: `Kwa nini umependekeza kusubiri kabla ya kumwagilia shamba la ${crop}?`
        },
        {
          id: 'wait-changed',
          label: hasSuperseded ? '"Nini kilibadilika?"' : '"Nitaanza lini kumwagilia?"',
          fullQuery: hasSuperseded
            ? 'Ni nini kilichobadilika tangu asubuhi kilichosababisha uamuzi kuwa KUSUBIRI?'
            : `Ni wakati gani utakuwa salama na unaofaa kuanza kumwagilia tena zao la ${crop}?`
        },
        {
          id: 'wait-temp',
          label: `"Joto (${temp}°C) na ETc?"`,
          fullQuery: `Je, joto la sasa (${temp}°C) na unyevu wa udongo (${soilMoisture}%) vinaathiri vipi zao la ${crop}?`
        },
        {
          id: 'wait-rain',
          label: rainProb > 30 ? '"Kama mvua haitanyesha?"' : '"Kama mvua ya 15mm itanyesha?"',
          fullQuery: rainProb > 30
            ? 'Je, nini kitatokea iwapo mvua inayotabiriwa haitanyesha katika saa 24 zijazo?'
            : 'Je, nini kitatokea iwapo mvua ya 15mm itanyesha kesho shambani?'
        }
      ];
    }

    return [
      {
        id: 'wait-why',
        label: '"Why did you recommend waiting?"',
        fullQuery: `Why did you recommend waiting before irrigating the ${crop} field?`
      },
      {
        id: 'wait-changed',
        label: hasSuperseded ? '"What changed since this morning?"' : '"When can I irrigate?"',
        fullQuery: hasSuperseded
          ? 'What changed since this morning that triggered the switch to WAIT?'
          : `When is the next safe and optimal window to resume irrigating my ${crop}?`
      },
      {
        id: 'wait-temp',
        label: '"How does temperature affect ETc?"',
        fullQuery: `How does the current temperature (${temp}°C) and soil moisture (${soilMoisture}%) affect crop water demand (ETc) for ${crop}?`
      },
      {
        id: 'wait-rain',
        label: rainProb > 30 ? '"What if it doesn\'t rain?"' : '"What if 15mm rain falls tomorrow?"',
        fullQuery: rainProb > 30
          ? 'What should I do if the forecast rain does not materialize in the next 24 hours?'
          : 'What happens if 15mm of rain falls in the next 24 hours on this field?'
      }
    ];
  }

  if (rec === 'IRRIGATE') {
    if (isSwahili) {
      return [
        {
          id: 'irrigate-why',
          label: '"Kwa nini kumwagilia sasa?"',
          fullQuery: `Kwa nini unapendekeza kumwagilia zao la ${crop} sasa hivi?`
        },
        {
          id: 'irrigate-amount',
          label: '"Maji kiasi gani yanahitajika?"',
          fullQuery: `Ni kiasi gani cha maji (lita au mm) ninachopaswa kuweka kwenye shamba la ${crop} leo?`
        },
        {
          id: 'irrigate-temp',
          label: `"Joto (${temp}°C) na ETc?"`,
          fullQuery: `Joto la sasa (${temp}°C) na ukavu wa hewa vinaathiri vipi upotevu wa maji (ETc)?`
        },
        {
          id: 'irrigate-delay',
          label: '"Nikiahirisha hadi jioni?"',
          fullQuery: `Nini kitatokea iwapo nitaahirisha umwagiliaji hadi kesho asubuhi au jioni?`
        }
      ];
    }

    return [
      {
        id: 'irrigate-why',
        label: '"Why do you recommend irrigating?"',
        fullQuery: `Why do you recommend irrigating the ${crop} field right now?`
      },
      {
        id: 'irrigate-amount',
        label: '"How much water is needed?"',
        fullQuery: `How many millimeters or liters of water does my ${crop} require today to reach optimal field capacity?`
      },
      {
        id: 'irrigate-temp',
        label: '"How does temperature affect ETc?"',
        fullQuery: `How does the current temperature (${temp}°C) affect crop water demand (ETc) for ${crop}?`
      },
      {
        id: 'irrigate-delay',
        label: '"What if I delay irrigation?"',
        fullQuery: `What are the agronomic consequences if I delay irrigation until tomorrow morning?`
      }
    ];
  }

  if (rec === 'REASSESS') {
    if (isSwahili) {
      return [
        {
          id: 'reassess-why',
          label: '"Kwa nini kutathmini tena?"',
          fullQuery: `Kwa nini umependekeza kutathmini tena badala ya kumwagilia au kusubiri?`
        },
        {
          id: 'reassess-conflict',
          label: '"Data gani inapingana?"',
          fullQuery: `Ni ushahidi gani wa sensorer au hali ya hewa unaopingana kwenye shamba hili?`
        },
        {
          id: 'reassess-check',
          label: '"Nikague nini shambani?"',
          fullQuery: `Ni ukaguzi gani wa mikono ninaopaswa kufanya kwenye vipima-unyevu vya udongo hivi sasa?`
        },
        {
          id: 'reassess-whatif',
          label: '"Unyevu ukishuka zaidi?"',
          fullQuery: `Nini kitatokea iwapo unyevu wa udongo utashuka chini ya kiwango hatari cha 15%?`
        }
      ];
    }

    return [
      {
        id: 'reassess-why',
        label: '"Why recommend reassessing?"',
        fullQuery: `Why is a reassessment recommended instead of a direct irrigate or wait decision?`
      },
      {
        id: 'reassess-conflict',
        label: '"What evidence is conflicting?"',
        fullQuery: `What conflicting sensor or weather evidence caused AgriGuide to hesitate?`
      },
      {
        id: 'reassess-check',
        label: '"What should I check on site?"',
        fullQuery: `What physical checks should I perform on the soil probe or field telemetry right now?`
      },
      {
        id: 'reassess-whatif',
        label: '"What if moisture drops?"',
        fullQuery: `What happens if soil moisture drops below the critical 15% wilting threshold?`
      }
    ];
  }

  // Default / Initial state
  if (isSwahili) {
    return [
      {
        id: 'init-irrigate',
        label: '"Nipaswe kumwagilia leo?"',
        fullQuery: `Je, nipaswe kumwagilia shamba langu la ${crop} leo?`
      },
      {
        id: 'init-conditions',
        label: '"Hali ya shamba sasa?"',
        fullQuery: `Hali ya sasa ya unyevu wa udongo na utabiri wa hali ya hewa ni ipi?`
      },
      {
        id: 'init-temp',
        label: '"Joto na mahitaji ya maji?"',
        fullQuery: `Joto la sasa (${temp}°C) linaathiri vipi mahitaji ya maji ya ${crop}?`
      },
      {
        id: 'init-rain',
        label: '"Kama mvua ya 15mm itanyesha?"',
        fullQuery: `Je, nini kitatokea iwapo mvua ya 15mm itanyesha katika saa 24 zijazo?`
      }
    ];
  }

  return [
    {
      id: 'init-irrigate',
      label: '"Should I irrigate today?"',
      fullQuery: `Should I turn on irrigation pumps for my ${crop} today?`
    },
    {
      id: 'init-conditions',
      label: '"Current field conditions?"',
      fullQuery: `What are the current soil moisture and weather conditions for this field?`
    },
    {
      id: 'init-temp',
      label: '"How does temperature affect ETc?"',
      fullQuery: `How does current temperature (${temp}°C) affect crop water demand (ETc) for ${crop}?`
    },
    {
      id: 'init-rain',
      label: '"What if 15mm rain falls tomorrow?"',
      fullQuery: `What happens if 15mm of rain falls in the next 24 hours on this field?`
    }
  ];
}
