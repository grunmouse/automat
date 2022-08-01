const {MapOfMap} = require('./special-map.js');

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


function cloneDFA(M){
	const A = new Set(M.A);
	const Q = new Set(M.Q);
	const s = M.s;
	const T = new Set(M.T);
	const d = new MapOfMap();
	for(let [q, a, r] of M.d){
		d.set(q, a, r);
	}
	return {A, Q, s, T, d};
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
			let q = Symbol(q1 + '.' + q2);
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
 * Создаёт множество, состоящее из попарных произведений членов множеств T1 и T2
 * @param table : MapOfMap<Q1, Q2, Q>
 * @param T1 : Iterable<Q1>
 * @param T2 : Iterable<Q2>
 * @return Set<Q>
 */
function multipleSetWithTable(table, T1, T2){
	const Q = new Set()
	for(let q1 of A1){
		for(let q2 of A2){
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
		A:{A, Q, s, T, d},
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
 * @param Q : Iterable;
 * @param T : Set<Q>
 */
function complementSet(Q, T){
	return new Set([...Q].fulter(q=>(!T.has(q)))); //Все члены, Q, не входящие в T
}

function joinSet(A, B){
	return new Set([...A, ...B]);
}

/**
 * Дополнение конечного автомата
 */
function complementDFA(A){
	let C = cloneDFO(A);
	C = addDevilStateInto(C);
	C.T = complementSet(C.Q, C.T); 
	
	return C;
}

/**
 * Объединение конечных автоматов
 */
function joinDFA(A1, A2){
	const {A, table, invert} = multipleDFA(A1, A2);
	
	A.T = joinSet(
		multipleSetWithTable(table, A1.T, A2.Q),
		multipleSetWithTable(table, A1.Q, A2.T)
	);
	
	return A;
}

/**
 * Пересечение конечных автоматов
 */
function intersectDFA(A1, A2){
	const {A, table, invert} = multipleDFA(A1, A2);
	return A;
}

/**
 * Разность конечных автоматов
 */
function subtraceDFA(A, B){
	return intersectDFA(A, complementDFA(B));
}