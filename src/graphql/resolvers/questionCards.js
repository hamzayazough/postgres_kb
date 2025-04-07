const questionCardModel = require('../../models/questionCard');

module.exports = {
  Query: {
    getQuestionCards: async (_, { subjectId }) => {
      const cards = await questionCardModel.findBySubjectId(subjectId);
      return cards.map(card => {
        let parsedOptions;
        
        if (typeof card.options === 'string') {
          try {
            parsedOptions = JSON.parse(card.options);
          } catch (e) {
            console.error('Error parsing options:', e);
            parsedOptions = [];
          }
        } else {
          parsedOptions = card.options;
        }
        
        return {
          ...card,
          options: parsedOptions
        };
      });
    },
    
    getQuestionCard: async (_, { id }) => {
      const card = await questionCardModel.findById(id);
      
      if (!card) {
        return null;
      }
      
      let parsedOptions;
      
      if (typeof card.options === 'string') {
        try {
          parsedOptions = JSON.parse(card.options);
        } catch (e) {
          console.error('Error parsing options for card ID', id, ':', e);
          parsedOptions = [];
        }
      } else {
        parsedOptions = card.options;
      }
      
      return {
        ...card,
        options: parsedOptions
      };
    }
  },
   
  Mutation: {
    addQuestionCard: async (_, { subjectId, question, options, date }) => {
      const optionsString = JSON.stringify(options);
      const card = await questionCardModel.create(subjectId, question, optionsString, date);
      return {
        ...card,
        options: options
      };
    },
      
    updateQuestionCard: async (_, { id, question, options }) => {
      const optionsString = options ? JSON.stringify(options) : undefined;
      const card = await questionCardModel.update(id, question, optionsString);
      return {
        ...card,
        options: options || JSON.parse(card.options)
      };
    },
      
    deleteQuestionCard: async (_, { id }) => {
      const card = await questionCardModel.delete(id);
      return {
        ...card,
        options: JSON.parse(card.options)
      };
    }
  }
};