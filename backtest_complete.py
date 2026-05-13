import requests
import pandas as pd
import time
from datetime import datetime, timedelta

# ========== YOUR EXACT STRATEGY FUNCTIONS ==========
def detect_bos(candles, index):
    """Break of Structure detection - identical to your JavaScript code"""
    if index < 30:
        return None
    highs = [c['high'] for c in candles[index-30:index]]
    lows = [c['low'] for c in candles[index-30:index]]
    recent_high = max(highs[-10:])
    prev_high = max(highs[-20:-10])
    recent_low = min(lows[-10:])
    prev_low = min(lows[-20:-10])
    
    if recent_high > prev_high:
        return {'type': 'BULLISH', 'level': prev_high}
    if recent_low < prev_low:
        return {'type': 'BEARISH', 'level': prev_low}
    return None

def check_retracement(candles, index, level, bias):
    """Retracement confirmation - requires 2+ candles"""
    if index < 15:
        return False
    
    sweep_index = -1
    for i in range(index-1, max(0, index-15), -1):
        if bias == 'BUY' and candles[i]['low'] <= level:
            sweep_index = i
            break
        if bias == 'SELL' and candles[i]['high'] >= level:
            sweep_index = i
            break
    
    if sweep_index == -1 or sweep_index >= index - 3:
        return False
    
    after_sweep = candles[sweep_index+1:index]
    if len(after_sweep) < 2:
        return False
    
    if bias == 'BUY':
        bullish_count = 0
        for i in range(min(2, len(after_sweep))):
            if after_sweep[i]['close'] > after_sweep[i]['open']:
                bullish_count += 1
            else:
                break
        closed_above = after_sweep[-1]['close'] > level
        return bullish_count >= 2 and closed_above
    else:
        bearish_count = 0
        for i in range(min(2, len(after_sweep))):
            if after_sweep[i]['close'] < after_sweep[i]['open']:
                bearish_count += 1
            else:
                break
        closed_below = after_sweep[-1]['close'] < level
        return bearish_count >= 2 and closed_below

def analyze_signal(candles, index, symbol):
    """Main signal analysis - your actual strategy"""
    if index < 50:
        return None
    
    current = candles[index-1]
    current_price = current['close']
    
    # Find recent support/resistance
    recent_lows = [c['low'] for c in candles[max(0, index-20):index]]
    recent_highs = [c['high'] for c in candles[max(0, index-20):index]]
    support = min(recent_lows)
    resistance = max(recent_highs)
    
    bos = detect_bos(candles, index)
    
    # Check if at support or resistance
    at_support = abs(current_price - support) / current_price < 0.0005
    at_resistance = abs(current_price - resistance) / current_price < 0.0005
    
    if at_support and bos and bos['type'] == 'BULLISH':
        retraced = check_retracement(candles, index, support, 'BUY')
        if retraced:
            return {'bias': 'BUY', 'grade': 'A', 'price': current_price}
    
    if at_resistance and bos and bos['type'] == 'BEARISH':
        retraced = check_retracement(candles, index, resistance, 'SELL')
        if retraced:
            return {'bias': 'SELL', 'grade': 'A', 'price': current_price}
    
    return None

# ========== DATA FETCHING (NO API KEYS) ==========
def fetch_forex_data(symbol, start_date, end_date):
    """Fetch forex data from Frankfurter API - same as your app"""
    # Map your symbols to Frankfurter format
    symbol_map = {
        'EURUSD': {'base': 'EUR', 'quote': 'USD'},
        'GBPUSD': {'base': 'GBP', 'quote': 'USD'},
        'USDJPY': {'base': 'USD', 'quote': 'JPY'},
        'USDCAD': {'base': 'USD', 'quote': 'CAD'},
        'USDCHF': {'base': 'USD', 'quote': 'CHF'}
    }
    
    if symbol not in symbol_map:
        print(f"No forex mapping for {symbol}")
        return None
    
    base = symbol_map[symbol]['base']
    quote = symbol_map[symbol]['quote']
    
    # Frankfurter API - no key required[citation:6][citation:10]
    url = f"https://api.frankfurter.dev/v2/rates?base={base}&symbols={quote}&from={start_date}&to={end_date}"
    
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            data = response.json()
            candles = []
            for date_str, rates in data.get('rates', {}).items():
                price = rates.get(quote)
                if price:
                    candles.append({
                        'timestamp': int(datetime.fromisoformat(date_str).timestamp()),
                        'date': date_str,
                        'open': price,
                        'high': price,
                        'low': price,
                        'close': price
                    })
            return candles
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
    return None

def fetch_crypto_data(symbol, days=365):
    """Fetch crypto data from CoinGecko - same as your app"""
    # Map your symbols to CoinGecko IDs
    symbol_map = {
        'BTCUSD': 'bitcoin',
        'ETHUSD': 'ethereum',
        'SOLUSD': 'solana'
    }
    
    if symbol not in symbol_map:
        print(f"No crypto mapping for {symbol}")
        return None
    
    coin_id = symbol_map[symbol]
    
    # CoinGecko API - public, no key required for 365 days[citation:3][citation:7]
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days={days}"
    
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            data = response.json()
            prices = data.get('prices', [])
            candles = []
            for i, price_point in enumerate(prices):
                if i > 0:
                    prev_price = prices[i-1][1]
                    curr_price = price_point[1]
                    candles.append({
                        'timestamp': int(price_point[0] / 1000),
                        'date': datetime.fromtimestamp(price_point[0] / 1000).strftime('%Y-%m-%d'),
                        'open': prev_price,
                        'high': max(prev_price, curr_price),
                        'low': min(prev_price, curr_price),
                        'close': curr_price
                    })
            return candles
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
    return None

def fetch_bitget_data(symbol, interval, limit=500):
    """Fetch data from Bitget - no API key required[citation:1]"""
    # Map your symbols to Bitget format
    symbol_map = {
        'BTCUSD': 'BTCUSDT',
        'ETHUSD': 'ETHUSDT',
        'XAUUSD': 'BTCUSDT'  # Bitget doesn't have gold
    }
    
    if symbol not in symbol_map:
        return None
    
    pair = symbol_map[symbol]
    url = f"https://api.bitget.com/api/v2/mix/market/history-candles?symbol={pair}&productType=USDT-FUTURES&granularity={interval}&limit={limit}"
    
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == '00000':
                candles = []
                for item in data.get('data', []):
                    candles.append({
                        'timestamp': int(item[0]) // 1000,
                        'open': float(item[1]),
                        'high': float(item[2]),
                        'low': float(item[3]),
                        'close': float(item[4])
                    })
                return candles
    except Exception as e:
        print(f"Error fetching Bitget data: {e}")
    return None

# ========== BACKTEST ENGINE ==========
def run_backtest():
    print("\n" + "="*60)
    print("OMNI-SIGNAL BACKTEST - REAL HISTORICAL DATA")
    print("="*60)
    
    # Configuration
    symbol = input("Enter symbol (EURUSD, GBPUSD, BTCUSD, ETHUSD, XAUUSD): ").upper()
    start_date = input("Enter start date (YYYY-MM-DD): ")
    end_date = input("Enter end date (YYYY-MM-DD): ")
    balance = float(input("Starting balance ($): ") or "7200")
    risk_percent = float(input("Risk per trade (%): ") or "1.0")
    
    print(f"\n📊 Fetching data for {symbol} from {start_date} to {end_date}...")
    
    # Fetch data based on asset type
    candles = None
    if symbol in ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF']:
        candles = fetch_forex_data(symbol, start_date, end_date)
    elif symbol in ['BTCUSD', 'ETHUSD', 'SOLUSD']:
        candles = fetch_crypto_data(symbol)
    else:
        print(f"Symbol {symbol} not supported. Falling back to Bitget...")
        candles = fetch_bitget_data(symbol, 60, 500)
    
    if not candles or len(candles) < 50:
        print(f"❌ Failed to fetch data. Got {len(candles) if candles else 0} candles.")
        return
    
    print(f"✅ Loaded {len(candles)} candles")
    print("🚀 Running backtest...")
    
    # Run simulation
    trades = []
    current_balance = balance
    open_trade = None
    
    for i in range(50, len(candles)):
        # Check open trade for exit
        if open_trade:
            for j in range(open_trade['entry_index'] + 1, i + 1):
                if open_trade['bias'] == 'BUY':
                    if candles[j]['high'] >= open_trade['take_profit']:
                        # TP hit
                        profit = (open_trade['take_profit'] - open_trade['entry']) / open_trade['entry'] * current_balance * (risk_percent / 100) / open_trade['risk_percent']
                        current_balance += profit
                        trades.append({
                            'bias': 'BUY',
                            'grade': open_trade['grade'],
                            'entry': open_trade['entry'],
                            'exit': open_trade['take_profit'],
                            'pnl': profit,
                            'win': True
                        })
                        open_trade = None
                        break
                    elif candles[j]['low'] <= open_trade['stop_loss']:
                        # SL hit
                        loss = -(open_trade['entry'] - open_trade['stop_loss']) / open_trade['entry'] * current_balance * (risk_percent / 100) / open_trade['risk_percent']
                        current_balance += loss
                        trades.append({
                            'bias': 'BUY',
                            'grade': open_trade['grade'],
                            'entry': open_trade['entry'],
                            'exit': open_trade['stop_loss'],
                            'pnl': loss,
                            'win': False
                        })
                        open_trade = None
                        break
                else:  # SELL
                    if candles[j]['low'] <= open_trade['take_profit']:
                        profit = (open_trade['entry'] - open_trade['take_profit']) / open_trade['entry'] * current_balance * (risk_percent / 100) / open_trade['risk_percent']
                        current_balance += profit
                        trades.append({
                            'bias': 'SELL',
                            'grade': open_trade['grade'],
                            'entry': open_trade['entry'],
                            'exit': open_trade['take_profit'],
                            'pnl': profit,
                            'win': True
                        })
                        open_trade = None
                        break
                    elif candles[j]['high'] >= open_trade['stop_loss']:
                        loss = -(open_trade['stop_loss'] - open_trade['entry']) / open_trade['entry'] * current_balance * (risk_percent / 100) / open_trade['risk_percent']
                        current_balance += loss
                        trades.append({
                            'bias': 'SELL',
                            'grade': open_trade['grade'],
                            'entry': open_trade['entry'],
                            'exit': open_trade['stop_loss'],
                            'pnl': loss,
                            'win': False
                        })
                        open_trade = None
                        break
        
        # Look for new signal
        if not open_trade:
            signal = analyze_signal(candles, i, symbol)
            if signal:
                stop_distance = 0.002 if symbol in ['EURUSD', 'GBPUSD'] else (15 if symbol == 'XAUUSD' else 1000)
                if symbol == 'XAUUSD':
                    stop_distance = 15
                elif symbol in ['BTCUSD', 'ETHUSD']:
                    stop_distance = 1000
                else:
                    stop_distance = 0.002
                
                stop_loss = signal['price'] - stop_distance if signal['bias'] == 'BUY' else signal['price'] + stop_distance
                risk = abs(signal['price'] - stop_loss)
                take_profit = signal['price'] + (risk * 2) if signal['bias'] == 'BUY' else signal['price'] - (risk * 2)
                
                open_trade = {
                    'entry_index': i,
                    'entry': signal['price'],
                    'bias': signal['bias'],
                    'grade': signal['grade'],
                    'stop_loss': stop_loss,
                    'take_profit': take_profit,
                    'risk_percent': risk_percent
                }
    
    # Results
    total_return = ((current_balance - balance) / balance) * 100
    wins = len([t for t in trades if t['win']])
    losses = len([t for t in trades if not t['win']])
    win_rate = (wins / len(trades) * 100) if trades else 0
    
    print("\n" + "="*60)
    print("📈 BACKTEST RESULTS")
    print("="*60)
    print(f"Total Trades: {len(trades)}")
    print(f"Winning Trades: {wins}")
    print(f"Losing Trades: {losses}")
    print(f"Win Rate: {win_rate:.1f}%")
    print(f"Total Return: {total_return:.2f}%")
    print(f"Final Balance: ${current_balance:,.2f}")
    
    # Grade breakdown
    grade_stats = {}
    for t in trades:
        if t['grade'] not in grade_stats:
            grade_stats[t['grade']] = {'wins': 0, 'total': 0}
        grade_stats[t['grade']]['total'] += 1
        if t['win']:
            grade_stats[t['grade']]['wins'] += 1
    
    if grade_stats:
        print("\n📊 Performance by Grade:")
        for grade, stats in grade_stats.items():
            wr = (stats['wins'] / stats['total'] * 100)
            print(f"  {grade}: {stats['total']} trades | {wr:.1f}% win rate")
    
    # Save results
    df = pd.DataFrame(trades)
    df.to_csv('backtest_results.csv', index=False)
    print(f"\n✅ Detailed results saved to backtest_results.csv")

if __name__ == "__main__":
    run_backtest()
