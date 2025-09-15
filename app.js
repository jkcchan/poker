// Poker Situation Generator
function getShuffledDeck() {
	const suits = ['♠', '♥', '♦', '♣'];
	const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	const deck = [];
	for (const suit of suits) {
		for (const rank of ranks) {
			deck.push(`${rank}${suit}`);
		}
	}
	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}
	return deck;
}

function generateSituation() {
	const deck = getShuffledDeck();
	const hand = [deck.pop(), deck.pop()];
	const flop = [deck.pop(), deck.pop(), deck.pop()];
	const turn = deck.pop();
	const river = deck.pop();
	const boardType = Math.floor(Math.random() * 2); // 0: flop, 1: flop+turn, 2: flop+turn+river
	let board = [];
	if (boardType === 0) {
		board = flop;
	} else if (boardType === 1) {
		board = flop.concat([turn]);
	} else {
		board = flop.concat([turn, river]);
	}
	return { hand, board };
}


function cardToSpan(card) {
	// 4-color scheme: spades (black), hearts (red), diamonds (blue), clubs (green)
	const suit = card.slice(-1);
	let color = '';
	switch (suit) {
		case '♠': color = '#222'; break; // black
		case '♥': color = '#d00'; break; // red
		case '♦': color = '#0074d9'; break; // blue
		case '♣': color = '#228B22'; break; // green
		default: color = '#222';
	}
	return `<span style="color:${color};font-weight:bold;font-size:1.2em;">${card}</span>`;
}


// Poker hand evaluator helpers
const RANK_ORDER = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
const RANKS = Object.keys(RANK_ORDER);

function parseCard(card) {
	// e.g. '10♠' or 'A♥'
	const suit = card.slice(-1);
	const rank = card.slice(0, card.length-1);
	return {rank, suit, value: RANK_ORDER[rank]};
}

function getCombinations(arr, k) {
	// Returns all k-length combinations of arr
	const results = [];
	function helper(start, combo) {
		if (combo.length === k) {
			results.push(combo);
			return;
		}
		for (let i = start; i < arr.length; i++) {
			helper(i+1, combo.concat([arr[i]]));
		}
	}
	helper(0, []);
	return results;
}

function evaluateHand(cards) {
	// cards: array of 5 parsed cards
	const ranks = cards.map(c => c.value).sort((a,b) => b-a);
	const suits = cards.map(c => c.suit);
	const rankCounts = {};
	for (const c of cards) rankCounts[c.value] = (rankCounts[c.value]||0)+1;
	const counts = Object.values(rankCounts).sort((a,b)=>b-a);
	const isFlush = suits.every(s => s === suits[0]);
	const isStraight = (() => {
		let r = [...new Set(ranks)].sort((a,b)=>b-a);
		if (r.length < 5) return false;
		for (let i=0; i<=r.length-5; i++) {
			if (r[i]-r[i+4] === 4) return true;
		}
		// Wheel: A-2-3-4-5
		if (r.includes(14) && r.slice(-4).join(',') === '5,4,3,2') return true;
		return false;
	})();
	// Royal Flush
	if (isFlush && isStraight && Math.min(...ranks) === 10) return 'Royal Flush';
	// Straight Flush
	if (isFlush && isStraight) return 'Straight Flush';
	// Four of a Kind
	if (counts[0] === 4) return 'Four of a Kind';
	// Full House
	if (counts[0] === 3 && counts[1] === 2) return 'Full House';
	// Flush
	if (isFlush) return 'Flush';
	// Straight
	if (isStraight) return 'Straight';
	// Three of a Kind
	if (counts[0] === 3) return 'Three of a Kind';
	// Two Pair
	if (counts[0] === 2 && counts[1] === 2) return 'Two Pair';
	// One Pair
	if (counts[0] === 2) return 'One Pair';
	// High Card
	return 'High Card';
}

function bestHandText(allCards) {
	// allCards: array of 5-7 card strings
	const parsed = allCards.map(parseCard);
	const combos = getCombinations(parsed, 5);
	let best = 'High Card';
	const order = [
		'Royal Flush','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','One Pair','High Card'
	];
	for (const combo of combos) {
		const hand = evaluateHand(combo);
		if (order.indexOf(hand) < order.indexOf(best)) best = hand;
	}
	return best;
}

function getBestHandDetails(allCards) {
	// Get detailed information about the best 5-card hand
	const parsed = allCards.map(parseCard);
	const combos = getCombinations(parsed, 5);
	let bestCombo = null;
	let bestHand = 'High Card';
	const order = [
		'Royal Flush','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','One Pair','High Card'
	];
	
	for (const combo of combos) {
		const hand = evaluateHand(combo);
		if (order.indexOf(hand) < order.indexOf(bestHand)) {
			bestHand = hand;
			bestCombo = combo;
		}
	}
	
	return { handType: bestHand, cards: bestCombo };
}

function isBetterSameCategory(currentDetails, newDetails, handType) {
	// Compare two hands of the same category to see if new is better
	const current = currentDetails.cards.map(c => c.value).sort((a,b) => b-a);
	const newHand = newDetails.cards.map(c => c.value).sort((a,b) => b-a);
	
	if (handType === 'Straight' || handType === 'Straight Flush') {
		// For straights, compare the highest card (but handle wheel A-2-3-4-5)
		const currentHigh = current.includes(14) && current.includes(2) && current.includes(3) && current.includes(4) && current.includes(5) ? 5 : Math.max(...current);
		const newHigh = newHand.includes(14) && newHand.includes(2) && newHand.includes(3) && newHand.includes(4) && newHand.includes(5) ? 5 : Math.max(...newHand);
		return newHigh > currentHigh;
	}
	
	if (handType === 'Royal Flush') {
		// All royal flushes are equal
		return false;
	}
	
	if (handType === 'Flush' || handType === 'High Card') {
		// Compare card by card, highest first
		for (let i = 0; i < 5; i++) {
			if (newHand[i] > current[i]) return true;
			if (newHand[i] < current[i]) return false;
		}
		return false;
	}
	
	if (handType === 'Four of a Kind') {
		const currentCounts = {};
		const newCounts = {};
		current.forEach(v => currentCounts[v] = (currentCounts[v]||0)+1);
		newHand.forEach(v => newCounts[v] = (newCounts[v]||0)+1);
		
		const currentQuads = parseInt(Object.keys(currentCounts).find(k => currentCounts[k] === 4));
		const newQuads = parseInt(Object.keys(newCounts).find(k => newCounts[k] === 4));
		
		if (newQuads > currentQuads) return true;
		if (newQuads < currentQuads) return false;
		
		// Same quads, compare kicker
		const currentKicker = current.find(v => v !== currentQuads);
		const newKicker = newHand.find(v => v !== newQuads);
		return newKicker > currentKicker;
	}
	
	if (handType === 'Three of a Kind') {
		const currentCounts = {};
		const newCounts = {};
		current.forEach(v => currentCounts[v] = (currentCounts[v]||0)+1);
		newHand.forEach(v => newCounts[v] = (newCounts[v]||0)+1);
		
		const currentTrips = parseInt(Object.keys(currentCounts).find(k => currentCounts[k] === 3));
		const newTrips = parseInt(Object.keys(newCounts).find(k => newCounts[k] === 3));
		
		if (newTrips > currentTrips) return true;
		if (newTrips < currentTrips) return false;
		
		// Same trips, compare kickers
		const currentKickers = current.filter(v => v !== currentTrips).sort((a,b) => b-a);
		const newKickers = newHand.filter(v => v !== newTrips).sort((a,b) => b-a);
		
		for (let i = 0; i < 2; i++) {
			if (newKickers[i] > currentKickers[i]) return true;
			if (newKickers[i] < currentKickers[i]) return false;
		}
		return false;
	}
	
	if (handType === 'One Pair') {
		const currentCounts = {};
		const newCounts = {};
		current.forEach(v => currentCounts[v] = (currentCounts[v]||0)+1);
		newHand.forEach(v => newCounts[v] = (newCounts[v]||0)+1);
		
		const currentPair = parseInt(Object.keys(currentCounts).find(k => currentCounts[k] === 2));
		const newPair = parseInt(Object.keys(newCounts).find(k => newCounts[k] === 2));
		
		if (newPair > currentPair) return true;
		if (newPair < currentPair) return false;
		
		// Same pair, compare kickers
		const currentKickers = current.filter(v => v !== currentPair).sort((a,b) => b-a);
		const newKickers = newHand.filter(v => v !== newPair).sort((a,b) => b-a);
		
		for (let i = 0; i < 3; i++) {
			if (newKickers[i] > currentKickers[i]) return true;
			if (newKickers[i] < currentKickers[i]) return false;
		}
		return false;
	}
	
	if (handType === 'Two Pair') {
		// Proper two pair comparison
		const currentCounts = {};
		const newCounts = {};
		current.forEach(v => currentCounts[v] = (currentCounts[v]||0)+1);
		newHand.forEach(v => newCounts[v] = (newCounts[v]||0)+1);
		
		// Get the two pairs for each hand
		const currentPairs = Object.keys(currentCounts).filter(k => currentCounts[k] === 2).map(k => parseInt(k)).sort((a,b) => b-a);
		const newPairs = Object.keys(newCounts).filter(k => newCounts[k] === 2).map(k => parseInt(k)).sort((a,b) => b-a);
		
		// Compare high pair first
		if (newPairs[0] > currentPairs[0]) return true;
		if (newPairs[0] < currentPairs[0]) return false;
		
		// Same high pair, compare low pair
		if (newPairs[1] > currentPairs[1]) return true;
		if (newPairs[1] < currentPairs[1]) return false;
		
		// Same two pairs, compare kicker
		const currentKicker = current.find(v => !currentPairs.includes(v));
		const newKicker = newHand.find(v => !newPairs.includes(v));
		return newKicker > currentKicker;
	}
	
	if (handType === 'Full House') {
		// Compare trips first, then pair
		const currentCounts = {};
		const newCounts = {};
		current.forEach(v => currentCounts[v] = (currentCounts[v]||0)+1);
		newHand.forEach(v => newCounts[v] = (newCounts[v]||0)+1);
		
		const currentTrips = parseInt(Object.keys(currentCounts).find(k => currentCounts[k] === 3));
		const newTrips = parseInt(Object.keys(newCounts).find(k => newCounts[k] === 3));
		
		if (newTrips > currentTrips) return true;
		if (newTrips < currentTrips) return false;
		
		// Same trips, compare pair
		const currentPair = parseInt(Object.keys(currentCounts).find(k => currentCounts[k] === 2));
		const newPair = parseInt(Object.keys(newCounts).find(k => newCounts[k] === 2));
		return newPair > currentPair;
	}
	
	return false;
}

function getBackdoorFlushOuts(hand, board, remainingCards) {
	// Check for backdoor flush draws (need 2 more of same suit)
	const allCards = [...hand, ...board];
	const suitCounts = {};
	
	// Count suits in hand + board
	for (const card of allCards) {
		const suit = card.slice(-1);
		suitCounts[suit] = (suitCounts[suit] || 0) + 1;
	}
	
	// Find suits with exactly 3 cards (need 2 more for flush)
	const backdoorSuits = [];
	for (const [suit, count] of Object.entries(suitCounts)) {
		if (count === 3) {
			backdoorSuits.push(suit);
		}
	}
	
	if (backdoorSuits.length === 0) return [];
	
	// Find cards that complete backdoor flush
	const backdoorOuts = [];
	for (const card of remainingCards) {
		const suit = card.slice(-1);
		if (backdoorSuits.includes(suit)) {
			backdoorOuts.push(card);
		}
	}
	
	return backdoorOuts;
}

function getBackdoorStraightOuts(hand, board, remainingCards) {
	// Check for backdoor straight draws (need 2 more for straight)
	const allCards = [...hand, ...board];
	const ranks = allCards.map(card => {
		const rank = card.slice(0, -1);
		return RANK_ORDER[rank];
	}).sort((a, b) => a - b);
	
	const uniqueRanks = [...new Set(ranks)];
	
	// Check if we can make a straight with 2 more cards
	const backdoorOuts = [];
	
	// This is complex - for simplicity, we'll look for cases where we have
	// some connected cards and could complete a straight
	// For example: if we have 5,7 we could hit 6,8 or 6,9 or 4,6 etc.
	
	// For now, return empty array - this is quite complex to implement properly
	// A full implementation would check all possible 2-card combinations
	return [];
}

function findNuts(board, heroHand = null) {
	// Find the best possible hand that someone else could have (excluding hero's cards)
	if (board.length === 0) return 'Pocket Aces';
	
	const suits = ['♠', '♥', '♦', '♣'];
	const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	const usedCards = new Set([...board, ...(heroHand || [])]);
	
	// Generate all possible remaining cards (excluding hero's hole cards)
	const remainingCards = [];
	for (const suit of suits) {
		for (const rank of ranks) {
			const card = `${rank}${suit}`;
			if (!usedCards.has(card)) {
				remainingCards.push(card);
			}
		}
	}
	
	// Try all possible 2-card combinations with the board
	let bestHand = 'High Card';
	const order = [
		'Royal Flush','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','One Pair','High Card'
	];
	
	for (let i = 0; i < remainingCards.length; i++) {
		for (let j = i + 1; j < remainingCards.length; j++) {
			const holeCards = [remainingCards[i], remainingCards[j]];
			const allCards = holeCards.concat(board);
			const handStrength = bestHandText(allCards);
			if (order.indexOf(handStrength) < order.indexOf(bestHand)) {
				bestHand = handStrength;
			}
		}
	}
	
	return bestHand;
}

function calculatePotOdds(potSize, betToCall) {
	// Calculate pot odds as a percentage
	if (betToCall === 0) return 0;
	const totalPot = potSize + betToCall;
	const oddsPercentage = (betToCall / totalPot) * 100;
	return Math.round(oddsPercentage * 10) / 10;
}

function shouldCall(equity, potOdds) {
	// Simple decision: call if equity > pot odds
	return equity > potOdds;
}

function generatePotOddsScenario() {
	// Generate a realistic pot odds scenario
	const scenarios = [
		{ pot: 100, bet: 25 }, // 20% pot odds
		{ pot: 200, bet: 50 }, // 20% pot odds
		{ pot: 150, bet: 50 }, // 25% pot odds
		{ pot: 300, bet: 100 }, // 25% pot odds
		{ pot: 200, bet: 80 }, // 28.6% pot odds
		{ pot: 100, bet: 50 }, // 33.3% pot odds
		{ pot: 120, bet: 60 }, // 33.3% pot odds
		{ pot: 180, bet: 120 }, // 40% pot odds
	];
	
	return scenarios[Math.floor(Math.random() * scenarios.length)];
}

function calculateOuts(hand, board) {
	// Calculate outs to improve hand to better categories OR better version of same category
	if (board.length === 0 || board.length >= 5) return { outs: [], total: 0 };
	
	const suits = ['♠', '♥', '♦', '♣'];
	const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	const usedCards = new Set([...hand, ...board]);
	const currentAllCards = [...hand, ...board];
	const currentHand = bestHandText(currentAllCards);
	const currentHandDetails = getBestHandDetails(currentAllCards);
	
	const remainingCards = [];
	for (const suit of suits) {
		for (const rank of ranks) {
			const card = `${rank}${suit}`;
			if (!usedCards.has(card)) {
				remainingCards.push(card);
			}
		}
	}
	
	const order = [
		'Royal Flush','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','One Pair','High Card'
	];
	const currentRank = order.indexOf(currentHand);
	
	const improvingCards = [];
	const handCategories = {};
	
	// For flop situations, also check for backdoor draws (need 2 cards)
	if (board.length === 3) {
		// Check backdoor flush draws
		const backdoorFlushOuts = getBackdoorFlushOuts(hand, board, remainingCards);
		if (backdoorFlushOuts.length > 0) {
			handCategories['Backdoor Flush'] = backdoorFlushOuts;
			improvingCards.push(...backdoorFlushOuts);
		}
		
		// Check backdoor straight draws
		const backdoorStraightOuts = getBackdoorStraightOuts(hand, board, remainingCards);
		if (backdoorStraightOuts.length > 0) {
			handCategories['Backdoor Straight'] = backdoorStraightOuts;
			improvingCards.push(...backdoorStraightOuts);
		}
	}
	
	// Regular single-card outs
	for (const card of remainingCards) {
		const newBoard = [...board, card];
		const newAllCards = [...hand, ...newBoard];
		const newHand = bestHandText(newAllCards);
		const newRank = order.indexOf(newHand);
		const newHandDetails = getBestHandDetails(newAllCards);
		
		// Check if it's a better hand category OR better version of same category
		let isImprovement = false;
		if (newRank < currentRank) {
			// Better hand category
			isImprovement = true;
		} else if (newRank === currentRank && currentHand !== 'High Card') {
			// Same category, check if it's better
			isImprovement = isBetterSameCategory(currentHandDetails, newHandDetails, currentHand);
		}
		
		if (isImprovement) {
			if (!improvingCards.includes(card)) {
				improvingCards.push(card);
			}
			const categoryKey = newRank < currentRank ? newHand : `Better ${currentHand}`;
			if (!handCategories[categoryKey]) handCategories[categoryKey] = [];
			if (!handCategories[categoryKey].includes(card)) {
				handCategories[categoryKey].push(card);
			}
		}
	}
	
	return { 
		outs: improvingCards, 
		total: improvingCards.length,
		byCategory: handCategories
	};
}

function calculateEquity(outs, board) {
	// Calculate equity percentage based on outs and remaining cards
	if (outs === 0 || board.length >= 5) return 0;
	
	const cardsInPlay = 2 + board.length; // hole cards + board
	const unknownCards = 52 - cardsInPlay;
	
	let equity = 0;
	
	if (board.length === 3) { // Flop - 2 cards to come
		// Rule of 4: multiply outs by 4 for approximate equity
		equity = Math.min((outs * 4), 100);
	} else if (board.length === 4) { // Turn - 1 card to come
		// Rule of 2: multiply outs by 2 for approximate equity
		equity = Math.min((outs * 2), 100);
	}
	
	// More precise calculation: 1 - (non-outs/total)^cards_to_come
	const cardsRemaining = 5 - board.length;
	const nonOuts = unknownCards - outs;
	const preciseEquity = (1 - Math.pow(nonOuts / unknownCards, cardsRemaining)) * 100;
	
	return Math.round(preciseEquity * 10) / 10; // Round to 1 decimal
}

function calculateEquityByHand(hand, board) {
	// Calculate equity breakdown by hand type
	if (board.length === 0 || board.length >= 5) return {};
	
	const suits = ['♠', '♥', '♦', '♣'];
	const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	const usedCards = new Set([...hand, ...board]);
	const currentHand = bestHandText([...hand, ...board]);
	
	const remainingCards = [];
	for (const suit of suits) {
		for (const rank of ranks) {
			const card = `${rank}${suit}`;
			if (!usedCards.has(card)) {
				remainingCards.push(card);
			}
		}
	}
	
	const order = [
		'Royal Flush','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','One Pair','High Card'
	];
	const currentRank = order.indexOf(currentHand);
	
	const equityByHand = {};
	const totalCards = remainingCards.length;
	
	for (const card of remainingCards) {
		const newBoard = [...board, card];
		const newHand = bestHandText([...hand, ...newBoard]);
		const newRank = order.indexOf(newHand);
		
		if (newRank < currentRank) { // Better hand (lower index = better)
			if (!equityByHand[newHand]) equityByHand[newHand] = 0;
			equityByHand[newHand]++;
		}
	}
	
	// Convert counts to percentages
	const equityPercentages = {};
	for (const [handType, count] of Object.entries(equityByHand)) {
		equityPercentages[handType] = Math.round((count / totalCards) * 100 * 10) / 10;
	}
	
	return equityPercentages;
}

let currentSituation = null;
let quizMode = false;

function generateQuizOptions(correctAnswer, type) {
	const options = [correctAnswer];
	
	if (type === 'hand') {
		const allHands = ['Royal Flush','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','One Pair','High Card'];
		const wrongOptions = allHands.filter(h => h !== correctAnswer);
		
		// Add 2-3 random wrong options
		while (options.length < 4 && wrongOptions.length > 0) {
			const randomIndex = Math.floor(Math.random() * wrongOptions.length);
			options.push(wrongOptions.splice(randomIndex, 1)[0]);
		}
	} else if (type === 'outs') {
		const correctNum = parseInt(correctAnswer);
		const wrongNums = [];
		
		// Generate plausible wrong numbers
		for (let i = Math.max(0, correctNum - 3); i <= correctNum + 3; i++) {
			if (i !== correctNum && i >= 0 && i <= 20) wrongNums.push(i);
		}
		
		while (options.length < 4 && wrongNums.length > 0) {
			const randomIndex = Math.floor(Math.random() * wrongNums.length);
			options.push(wrongNums.splice(randomIndex, 1)[0].toString());
		}
	} else if (type === 'equity') {
		const correctNum = parseFloat(correctAnswer);
		const wrongNums = [];
		
		// Generate plausible wrong percentages
		for (let i = 5; i <= 95; i += 5) {
			if (Math.abs(i - correctNum) > 5) wrongNums.push(i + '%');
		}
		
		while (options.length < 4 && wrongNums.length > 0) {
			const randomIndex = Math.floor(Math.random() * wrongNums.length);
			options.push(wrongNums.splice(randomIndex, 1)[0]);
		}
	} else if (type === 'potodds') {
		const correctNum = parseFloat(correctAnswer);
		const wrongNums = [];
		
		// Generate plausible wrong pot odds percentages
		const baseNums = [20, 25, 28.6, 33.3, 40, 50];
		for (const num of baseNums) {
			if (Math.abs(num - correctNum) > 2) wrongNums.push(num + '%');
		}
		
		while (options.length < 4 && wrongNums.length > 0) {
			const randomIndex = Math.floor(Math.random() * wrongNums.length);
			options.push(wrongNums.splice(randomIndex, 1)[0]);
		}
	} else if (type === 'decision') {
		const wrongOptions = correctAnswer === 'CALL' ? ['FOLD', 'RAISE', 'CHECK'] : ['CALL', 'RAISE', 'CHECK'];
		while (options.length < 4 && wrongOptions.length > 0) {
			const randomIndex = Math.floor(Math.random() * wrongOptions.length);
			options.push(wrongOptions.splice(randomIndex, 1)[0]);
		}
	}
	
	// Shuffle options
	for (let i = options.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[options[i], options[j]] = [options[j], options[i]];
	}
	
	return options;
}

function showQuiz(situation) {
	const { hand, board, potOdds } = situation;
	const allCards = hand.concat(board);
	const currentHand = bestHandText(allCards);
	const nuts = findNuts(board, hand);
	const outs = calculateOuts(hand, board);
	const equity = board.length < 5 ? calculateEquity(outs.total, board) : 0;
	
	const questions = [];
	
	// Question 1: Current best hand
	questions.push({
		question: "What is your current best hand?",
		correct: currentHand,
		options: generateQuizOptions(currentHand, 'hand'),
		type: 'hand'
	});
	
	// Question 2: The nuts
	questions.push({
		question: "What is the nuts (opponent's best possible hand)?",
		correct: nuts,
		options: generateQuizOptions(nuts, 'hand'),
		type: 'hand'
	});
	
	// Question 3: Number of outs (if applicable)
	if (board.length < 5) {
		questions.push({
			question: "How many outs do you have to improve?",
			correct: outs.total.toString(),
			options: generateQuizOptions(outs.total.toString(), 'outs'),
			type: 'outs'
		});
		
		// Question 4: Equity (if applicable)
		if (outs.total > 0) {
			questions.push({
				question: "What is your equity percentage?",
				correct: equity + '%',
				options: generateQuizOptions(equity + '%', 'equity'),
				type: 'equity'
			});
		}
		
		// Question 5: Pot odds (if applicable)
		if (potOdds) {
			const potOddsPercentage = calculatePotOdds(potOdds.pot, potOdds.bet);
			questions.push({
				question: `Pot: $${potOdds.pot}, Bet to call: $${potOdds.bet}. What are the pot odds?`,
				correct: potOddsPercentage + '%',
				options: generateQuizOptions(potOddsPercentage + '%', 'potodds'),
				type: 'potodds'
			});
			
			// Question 6: Call/Fold decision
			const decision = shouldCall(equity, potOddsPercentage) ? 'CALL' : 'FOLD';
			questions.push({
				question: `Pot: $${potOdds.pot}, Bet to call: $${potOdds.bet}. Based on your hand analysis, what should you do?`,
				correct: decision,
				options: generateQuizOptions(decision, 'decision'),
				type: 'decision'
			});
		}
	}
	
	return questions;
}

function renderSituation() {
	const situation = generateSituation();
	currentSituation = situation;
	// Add pot odds scenario
	currentSituation.potOdds = generatePotOddsScenario();
	
	const { hand, board } = situation;
	const handDiv = document.getElementById('hand');
	const boardDiv = document.getElementById('board');
	
	handDiv.innerHTML = `Your hand: ${hand.map(cardToSpan).join('  ')}`;
	boardDiv.innerHTML = `Board: ${board.map(cardToSpan).join('  ')}`;
	
	// Hide analysis and show quiz button
	const analysisDiv = document.getElementById('analysis');
	const quizDiv = document.getElementById('quiz');
	if (analysisDiv) analysisDiv.style.display = 'none';
	if (quizDiv) quizDiv.innerHTML = '';
	
	quizMode = false;
}

function showAnalysis() {
	if (!currentSituation) return;
	
	const { hand, board, potOdds } = currentSituation;
	const analysisDiv = document.getElementById('analysis');
	
	if (board.length === 0) {
		analysisDiv.innerHTML = '<div style="margin-top:1em;color:#888;">Deal a flop to see analysis</div>';
		return;
	}
	
	const allCards = hand.concat(board);
	const nuts = findNuts(board, hand);
	const outs = calculateOuts(hand, board);
	
	let bestText = `<div style="margin-top:1em;font-size:1.1em;">Your best hand: <b>${bestHandText(allCards)}</b></div>`;
	let nutsText = `<div style="margin-top:0.5em;font-size:1.1em;color:#666;">The nuts (opponent's best possible): <b>${nuts}</b></div>`;
	let outsText = '';
	let potOddsText = '';
	
	// Add pot odds analysis
	if (potOdds && board.length < 5) {
		const potOddsPercentage = calculatePotOdds(potOdds.pot, potOdds.bet);
		const equity = outs.total > 0 ? calculateEquity(outs.total, board) : 0;
		const decision = shouldCall(equity, potOddsPercentage) ? 'CALL' : 'FOLD';
		const decisionColor = decision === 'CALL' ? '#228B22' : '#d00';
		
		potOddsText = `<div style="margin-top:0.5em;font-size:1.0em;border:1px solid #ddd;padding:0.5em;border-radius:4px;">
			<b>Pot Odds Analysis:</b><br>
			Pot: $${potOdds.pot}, Bet to call: $${potOdds.bet}<br>
			Pot odds: ${potOddsPercentage}% | Your equity: ${equity}%<br>
			<span style="color:${decisionColor};font-weight:bold;">Decision: ${decision}</span>
		</div>`;
	}
	
	if (board.length < 5 && outs.total > 0) {
		const equity = calculateEquity(outs.total, board);
		const equityByHand = calculateEquityByHand(hand, board);
		
		let outsDetails = '';
		for (const [category, cards] of Object.entries(outs.byCategory)) {
			outsDetails += `<div style="margin-left:1em;font-size:0.9em;color:#888;">
				${category}: ${cards.map(cardToSpan).join(' ')} (${cards.length})
			</div>`;
		}
		
		let equityDetails = '';
		if (Object.keys(equityByHand).length > 0) {
			equityDetails = '<div style="margin-top:0.5em;"><b>Equity breakdown by hand:</b>';
			for (const [handType, percentage] of Object.entries(equityByHand)) {
				equityDetails += `<div style="margin-left:1em;font-size:0.9em;color:#555;">
					${handType}: ${percentage}%
				</div>`;
			}
			equityDetails += '</div>';
		}
		
		outsText = `<div style="margin-top:0.5em;font-size:1.0em;">
			<b>Outs to improve (${outs.total} total) - ${equity}% total equity:</b>
			${outsDetails}
			${equityDetails}
		</div>`;
	} else if (board.length < 5) {
		outsText = `<div style="margin-top:0.5em;font-size:1.0em;color:#888;">No outs to improve current hand - 0% equity</div>`;
	}
	
	analysisDiv.innerHTML = bestText + nutsText + outsText + potOddsText;
	analysisDiv.style.display = 'block';
}

function startQuiz() {
	if (!currentSituation || currentSituation.board.length === 0) return;
	
	const questions = showQuiz(currentSituation);
	const quizDiv = document.getElementById('quiz');
	quizMode = true;
	
	let quizHTML = '<div style="margin-top:1em;"><h3>Quiz Time!</h3>';
	
	questions.forEach((q, qIndex) => {
		quizHTML += `<div style="margin:1em 0; padding:1em; border:1px solid #ddd; border-radius:8px;">
			<div style="font-weight:bold; margin-bottom:0.5em;">${q.question}</div>`;
		
		q.options.forEach((option, oIndex) => {
			quizHTML += `<div style="margin:0.3em 0;">
				<label style="cursor:pointer;">
					<input type="radio" name="q${qIndex}" value="${option}" style="margin-right:0.5em;">
					${option}
				</label>
			</div>`;
		});
		
		quizHTML += `<div id="result${qIndex}" style="margin-top:0.5em; font-weight:bold;"></div>`;
		quizHTML += '</div>';
	});
	
	quizHTML += '<button id="checkAnswersBtn" style="padding:0.5em 1em; margin:1em 0;">Check Answers</button>';
	quizHTML += '</div>';
	
	quizDiv.innerHTML = quizHTML;
	
	// Add event listener for the check answers button
	document.getElementById('checkAnswersBtn').addEventListener('click', checkAnswers);
}

function checkAnswers() {
	console.log('checkAnswers called');
	if (!currentSituation) {
		console.log('No current situation');
		return;
	}
	
	const questions = showQuiz(currentSituation);
	console.log('Questions:', questions.length);
	let score = 0;
	const userAnswers = [];
	
	questions.forEach((q, qIndex) => {
		const selected = document.querySelector(`input[name="q${qIndex}"]:checked`);
		const resultDiv = document.getElementById(`result${qIndex}`);
		
		let isCorrect = false;
		let userAnswer = null;
		
		if (selected) {
			userAnswer = selected.value;
			if (selected.value === q.correct) {
				resultDiv.innerHTML = '<span style="color:green;">✓ Correct!</span>';
				score++;
				isCorrect = true;
			} else {
				resultDiv.innerHTML = `<span style="color:red;">✗ Wrong. Correct answer: ${q.correct}</span>`;
			}
		} else {
			resultDiv.innerHTML = '<span style="color:orange;">No answer selected</span>';
		}
		
		// Store the question result
		userAnswers.push({
			question: q.question,
			userAnswer: userAnswer,
			correctAnswer: q.correct,
			isCorrect: isCorrect,
			type: q.type
		});
	});
	
	console.log('About to save quiz result with score:', score, 'out of', questions.length);
	// Save quiz result to localStorage
	saveQuizResult(currentSituation, userAnswers, score, questions.length);
	
	const quizDiv = document.getElementById('quiz');
	quizDiv.innerHTML += `<div style="margin-top:1em; padding:1em; background:#f0f0f0; border-radius:8px;">
		<strong>Score: ${score}/${questions.length}</strong>
		<div style="margin-top:0.5em; font-size:0.9em; color:#666;">
			Quiz result saved! View all results in <a href="review.html" target="_blank" style="color:#2d2d2d;">Review Results</a>
		</div>
	</div>`;
}

function saveQuizResult(situation, userAnswers, score, totalQuestions) {
	console.log('saveQuizResult called with:', {situation, userAnswers, score, totalQuestions});
	
	const timestamp = new Date().toISOString();
	const quizResult = {
		id: timestamp, // Use timestamp as unique ID
		timestamp: timestamp,
		situation: {
			hand: situation.hand,
			board: situation.board,
			potOdds: situation.potOdds
		},
		answers: userAnswers,
		score: score,
		totalQuestions: totalQuestions,
		percentage: Math.round((score / totalQuestions) * 100)
	};
	
	console.log('Quiz result object created:', quizResult);
	
	// Get existing results from localStorage
	let savedResults = [];
	try {
		const stored = localStorage.getItem('pokerQuizResults');
		console.log('Existing localStorage data:', stored);
		if (stored) {
			savedResults = JSON.parse(stored);
		}
	} catch (e) {
		console.error('Error loading saved results:', e);
		savedResults = [];
	}
	
	// Add new result
	savedResults.push(quizResult);
	console.log('Adding new result. Total results now:', savedResults.length);
	
	// Keep only the last 50 results to avoid localStorage bloat
	if (savedResults.length > 50) {
		savedResults = savedResults.slice(-50);
	}
	
	// Save back to localStorage
	try {
		const dataToSave = JSON.stringify(savedResults);
		console.log('Attempting to save to localStorage:', dataToSave.length, 'characters');
		localStorage.setItem('pokerQuizResults', dataToSave);
		console.log('Quiz result saved to localStorage. Total results:', savedResults.length);
		
		// Verify it was saved
		const verification = localStorage.getItem('pokerQuizResults');
		console.log('Verification - data saved successfully:', !!verification);
	} catch (e) {
		console.error('Error saving quiz result:', e);
		alert('Error saving quiz result: ' + e.message);
	}
}

window.addEventListener('DOMContentLoaded', () => {
	const container = document.querySelector('.container');
	const handDiv = document.createElement('div');
	handDiv.id = 'hand';
	handDiv.style.margin = '1.5em 0 0.5em 0';
	const boardDiv = document.createElement('div');
	boardDiv.id = 'board';
	boardDiv.style.marginBottom = '1em';
	
	// Button container
	const buttonContainer = document.createElement('div');
	buttonContainer.style.marginBottom = '1em';
	
	const newSituationBtn = document.createElement('button');
	newSituationBtn.textContent = 'New Situation';
	newSituationBtn.onclick = renderSituation;
	newSituationBtn.style.marginRight = '0.5em';
	
	const quizBtn = document.createElement('button');
	quizBtn.textContent = 'Take Quiz';
	quizBtn.onclick = startQuiz;
	quizBtn.style.marginRight = '0.5em';
	
	const showAnalysisBtn = document.createElement('button');
	showAnalysisBtn.textContent = 'Show Analysis';
	showAnalysisBtn.onclick = showAnalysis;
	showAnalysisBtn.style.marginRight = '0.5em';
	
	const reviewBtn = document.createElement('button');
	reviewBtn.textContent = 'Review Results';
	reviewBtn.onclick = () => window.open('review.html', '_blank');
	reviewBtn.style.background = '#666';
	reviewBtn.style.color = 'white';
	reviewBtn.style.border = 'none';
	reviewBtn.style.padding = '0.5em 1em';
	reviewBtn.style.borderRadius = '4px';
	reviewBtn.style.cursor = 'pointer';
	
	buttonContainer.appendChild(newSituationBtn);
	buttonContainer.appendChild(quizBtn);
	buttonContainer.appendChild(showAnalysisBtn);
	buttonContainer.appendChild(reviewBtn);
	
	// Analysis and quiz containers
	const analysisDiv = document.createElement('div');
	analysisDiv.id = 'analysis';
	analysisDiv.style.display = 'none';
	
	const quizDiv = document.createElement('div');
	quizDiv.id = 'quiz';
	
	container.appendChild(handDiv);
	container.appendChild(boardDiv);
	container.appendChild(buttonContainer);
	container.appendChild(analysisDiv);
	container.appendChild(quizDiv);
	
	renderSituation();
});
