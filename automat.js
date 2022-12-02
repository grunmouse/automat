const {MapOfMap} = require('@grunmouse/special-map');
const {
	symbols:{UNION, INTERSECTION, DIFFERENCE, COMPLEMENT}, 
	operators
} = require('@grunmouse/multioperator-set-theory');



/**
 * @struct NFA
 * @property A : Iterable - алфавит
 * @property Q : Iterable - множество состояний
 * @property S : Set(Q) - множество начальных состояний S \subset Q
 * @property T : Set<Q> - множество допускающих состояний T \subset Q
 * @property d : MapOfMap<Q, A, Set<Q>> - таблица переходов
 *
 */

/**
 * @struct DFA
 * @property A : Iterable - алфавит
 * @property Q : Iterable - множество состояний
 * @property s - начальное состояние s \in Q
 * @property T : Set<Q> - множество допускающих состояний T \subset Q
 * @property d : MapOfMap<Q, A, Q> - таблица переходов
 *
 */
 
/** 
 * @param t : MapOfMap
 * @return MapOfMap
 */
 
function cloneTable(t){
	const d = new MapOfMap();
	for(let [q, a, r] of t){
		d.set(q, a, r);
	}
	return d;
}

class FA{
	constructor(M){
		this.A = new Set(M.A);
		this.Q = new Set(M.Q);
		this.T = new Set(M.T);
		this.d = cloneTable(M.d);
	}
}

class DFA extends FA{
	constructor(M){
		super(M);
		this.s = M.s;
		if(M.devil){
			addDevilStateInto(this);
		}
	}
	
	run(itrSymbols){
		let state = this.s;
		for(let sym of itrSymbols){
			if(!this.A.has(sym)){
				throw new RangeError(`Character ${sym} not from the alphabet`);
			}
			state = this.d.get(state, sym);
		}
		return state;
	}
}

class NFA extends FA{
	constructor(M){
		super(M);
		this.S = new Set(M.S);
	}
	
	/**
	 * \epsilon-замыкание множества состояний
	 */
	epsClosure(S){
		let queue = [...S];
		for(let index = 0; index<queue.length; ++index){
			let q = queue[index];
			let R = this.d.get(q, '');
			if(R) for(let r of R){
				if(!queue.includes(r)){
					queue.push(r);
				}
			}
		}
		return new Set(queue);
	}
	
	/** 
	 * переход из множества состояний S по символу a
	 */
	next(S, a){
		let result = [];
		for(let q of S){
			let R = this.d.get(q, a);
			result.push(...R);
		}
		result = new Set(result);
		return epsClosure(result);
	}
	
	run(itrSymbols, state){
		state = state || this.S;
		for(let sym of itrSymbols){
			if(!this.A.has(sym)){
				throw new RangeError(`Character ${sym} not from the alphabet`);
			}
			state = this.next(state, sym);
		}
		return state;
	}
}
 
/**
 * Создаёт для множеств A1 и A2 отображение произведений A1 x A2 -> Q
 * @param A1 : Iterable
 * @param A2 : Iterable
 * @return Object
 * @property Q : Set - множество, на которое отображается произведение
 * @property table : MapOfMap<A1,A2,Q> - таблица, отображающая пару членов A на член Q
 * @property invert : Map<Q,[A1,A2]> - таблица, отображающая пару членов A на член Q
 */
function makeMultipleTable(A1, A2){
	const Q = new Set(), m = new MapOfMap(), n = new Map();
	for(let q1 of A1){
		for(let q2 of A2){
			let q = Symbol(/* q1 + '.' + q2 */);
			m.set(q1, q2, q);
			n.set(q, [q1, q2]);
			Q.add(q);
		}
	}
	return {
		Q,
		table: m,
		invert: n
	};
}

/**
 * Создаёт множество, состоящее из попарных произведений членов множеств T1 и T2,  
 *    с использованием заранее сгенерированной таблицы произведений
 * @param table : MapOfMap<Q1, Q2, Q> - таблица произведений
 * @param T1 : Iterable<Q1>
 * @param T2 : Iterable<Q2>
 * @return Set<Q>
 */
function multipleSetWithTable(table, T1, T2){
	const Q = new Set()
	for(let q1 of T1){
		for(let q2 of T2){
			Q.add(table.get(q1, q2));
		}
	}
	return Q;
}

/**
 *
 * @param table : MapOfMap<Q1,Q2,Q> - таблица, отображающая пару членов A на член Q
 * @param invert : Map<Q,[Q1,Q2]> - таблица, отображающая пару членов A на член Q
 * @param Q : Iterable - общее множество состояний
 * @param A : Iterable - общий алфавит
 * @param d1 : MapOfMap<Q1, A, Q1>
 * @param d2 : MapOfMap<Q2, A, Q2>
 *
 * @return MapOfMap<Q, A, Q>
 *
 * d([q1, q2], a) = [d1(q1, a), d2(q2, a)]
 */
function multipleAutomatTable(table, invert, Q, A, d1, d2){
	const d = new MapOfMap();
	for(let q of Q){
		let [q1, q2] = invert.get(q);
		for(let a of A){
			let r1 = d1.get(q1, a);
			let r2 = d2.get(q2, a);
			let r = table.get(r1, r2);
			
			d.set(q, a, r);
		}
	}
	return d;
}

/**
 * Выполняет прямое умножение ДКА
 * @param A1 : DFA
 * @param A2 : DFA
 * @return DFA
 */
function multipleDFA(A1, A2){
	const A = new Set([...A1.A, ...A2.A]); //Объединение алфавитов
	const {Q, table, invert} = makeMultipleTable(A1.Q, A2.Q); // Создаём новое множество состояний и таблицу умножения состояний
	const s = table.get(A1.s, A2.s); //Находим новое начальное состояние, равное произведению исходных начальных состояний
	const T = multipleSetWithTable(table, A1.T, A2.T); //Создаём новое множество принимающих состояний
	const d = multipleAutomatTable(table, invert, Q, A, A1.d, A2.d); //
	
	return {
		A:new DFA({A, Q, s, T, d}),
		table, invert
	};
}

/**
 * Ищет в автомате "дьявольское состояние"
 * @param A : DFA
 * @return {A.Q|undefined} - состояние из множества состояний конечного автомата или ничего
 */
function findDevilState(A){
	state:for(let q of A.Q){
		for(let a of A.A){
			if(A.d.get(q, a) !== q){
				continue state;
			}
		}
		return q
	}
}

/**
 * Добавляет в автомат "дьявольское состояние"
 */
function addDevilStateInto(A){
	if(findDevilState(A)){
		return A;
	}
	
	let devil = Symbol('Devil');
	for(let a of A.A){
		A.d.set(devil, a, devil);
	}
	for(let q of A.Q){
		for(let a of A.A){
			if(A.d.get(q, a) == null){
				A.d.set(q, a, devil);
			}
		}
	}
	A.Q = new Set(A.Q);
	A.Q.add(devil);
	
	return A;
}

/**
 * Дополнение конечного автомата
 */
function complementDFA(A){
	let C = new DFA(A);
	C = addDevilStateInto(C);
	C.T = C.Q[DIFFERENCE](C.T); 
	
	return C;
}

operators.complement.def(DFA, complementDFA);
operators.complement.useName(DFA);

/**
 * Объединение конечных автоматов
 */
function joinDFA(A1, A2){
	const {A, table, invert} = multipleDFA(A1, A2);
	
	A.T = multipleSetWithTable(table, A1.T, A2.Q)[UNION](
		multipleSetWithTable(table, A1.Q, A2.T)
	);
	
	return A;
}

operators.union.def(DFA, DFA, joinDFA);
operators.union.useName(DFA);



/**
 * Пересечение конечных автоматов
 */
function intersectDFA(A1, A2){
	const {A, table, invert} = multipleDFA(A1, A2);
	return A;
}

operators.intersection.def(DFA, DFA, intersectDFA);
operators.intersection.useName(DFA);

/**
 * Разность конечных автоматов
 */
function subtraceDFA(A, B){
	return intersectDFA(A, complementDFA(B));
}

operators.difference.def(DFA, DFA, subtraceDFA );
operators.difference.useName(DFA );


function findEquivalenceClasses(M){
	const classes = new Set([M.T, M.Q[DIFFERENCE](M.T)]);
	const A = M.A;
	const d = M.d;
	const queue = [];
	for(let a of A){
		for(let cls of classes){
			queue.push([cls, a]);
		}
	}
	let index = 0;
	for(; index < queue.length; ++index){
		let [C, a] = queue[index];
		if(!classes.has(C)) continue;
		for(let R of classes){
			let R1 = new Set();
			let R2 = new Set();
			for(let q of R){
				if(C.has(d.get(q, a))){
					R1.add(q);
				}
				else{
					R2.add(q);
				}
			}
			if(R1.size >0 && R2.size>0){
				classes.delete(R);
				classes.add(R1);
				classes.add(R2);
				for(let a of A){
					queue.push([R1, a], [R2, a]);
				}
			}
		}
	}
	
	let classesMap = new Map();
	for(let cls of classes){
		let sym = Symbol();
		for(let q of cls){
			classesMap.set(q, sym);
		}
	}
	
	return classesMap;
}

function reachableStates(A){
	let Q = new Set([A.s]);
	let count = Q.size;
	
	do{
		count = Q.size;
		for(let q of Q){
			for(let [a, r] of A.d.get(q)){
				Q.add(r);
			}
		}
	
	}while(Q.size > count)
	
	return Q;
}


function minimizeDFA(A){
	let Q = reachableStates(A);
	let d = new MapOfMap(Array.from(Q, (q)=>([q, A.d.get(q)])));
	//Q - достижимые состояния, d - таблица перехода для достижимых состояний
	
	let classesMap = findEquivalenceClasses({Q, d, A:A.A, T:A.T});
	
	let d1 = new MapOfMap();
	for(let [q, a, r] of d){
		q1 = classesMap.get(q);
		r1 = classesMap.get(r);
		d1.set(q1, a, r1);
	}
	let Q1 = classesMap.values();
	
	return new DFA({Q:Q1, d:d1, A:A.A, s:A.s, T:Q1[INTERSECTION](A.T)});
}


/**
 * Реверсирует детерминированный конечный автомат
 * @param A : DFA
 * @return NFA
 */
function reverseDFA(A){
	const d1 = new MapOfMap();
	
	for(let [q, a, r] of A.d){
		let s = d1.get(r, a);
		if(!s){
			s = new Set([q]);
			d1.set(r, a, s);
		}
		else{
			s.add(q);
		}
	}
	
	return new NFA({A:A.A, Q:A.Q, d:d1, S:A.T, T:[A.s]});
}

/**
 * Строит детерминиированый КА по недетерминированному
 */
function determineNFA(A){
	const qOrder = [...A.Q[DIFFERENCE](A.T)];
	const countN = qOrder.length;
	qOrder.push(A.T);
	
	/**
	 * Кодовый номер множества состояний
	 * @param S : Set<Q>
	 * @return BigInt
	 */
	function qIndex(S){
		let index = 0n;
		for(let q of S){
			let i = qOrder.indexOf(q);
			index += 2n**BigInt(i);
		}
	}
	
	function isFinal(index){
		return index >= 2n**BigInt(countN);
	}
	
	const queue = [A.epsClosure(A.S)];
	const s = qIndex(queue[0]);
	const Q = new Set([qIndex(A.S)]);
	const d1 = new MapOfMap();
	for(let index = 0; index<=queue; ++index){
		let S = queue[index];
		let q = qIndex(S);
		for(let a of A.A){
			let R = A.next(S, A);
			let r = qIndex(R);
			d1.set(q, a, r);
			if(!Q.has(r)){
				queue.push(R);
				Q.add(r);
			}
		}
	}
	
	const T = [...Q].filter(isFinal);
	
	return new DFA({Q, A:A.A, T, s, d:d1});
}

module.exports = {
	DFA,
	NFA,
	minimizeDFA,
	reverseDFA,
	determineNFA
};