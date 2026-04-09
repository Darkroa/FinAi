import gradio as gr
import plotly.graph_objects as go
import pandas as pd
import yfinance as yf
from loguru import logger


# Your project imports
from src.trading.trade_bot import bot_manager
from src.trading.backtester import run_backtest
from src.analysis.trendline_analyzer import TrendlineAnalyzer


def start_bot_ui(ticker: str, paper: bool, initial_capital: float, risk_pct: float, max_pos: float):
    try:
        ticker = ticker.strip().upper()
        result = bot_manager.start_bot(
            ticker, 
            paper=paper
,
            risk_per_trade=risk_pct / 100,
            max_position_size=max_pos
        )
        return f"✅ **Bot started successfully for {ticker}**\nPaper: {paper} | Capital: ${initial_capital:,.0f}"
    except Exception as e:
        return f"❌ Error starting bot: {str(e)}"


def stop_bot_ui(ticker: str):
    try:
        ticker = ticker.strip().upper()
        result = bot_manager.stop_bot(ticker)
        return f"⛔ **Bot stopped for {ticker}**\n{result}"
    except Exception as e:
        return f"❌ Error stopping bot: {str(e)}"


def get_multi_status():
    statuses = bot_manager.get_all_status()
    if not statuses:
        return "No active bots."
    lines = ["## Active Bots\n"]
    for t, s in statuses.items():
        color = "🟢" if s.get('running', False) else "🔴"
        lines.append(f"{color} **{t}** — Portfolio: **${s.get('portfolio_value',0):,.2f}** | "
                     f"DD: **{s.get('current_drawdown_pct',0):.1f}%** | Pos: **{s.get('position',0):.4f}**")
    return "\n".join(lines)


def get_detailed_bot_status(selected_ticker: str):
    if not selected_ticker:
        return "Select a ticker to see detailed status."
    statuses = bot_manager.get_all_status()
    status = statuses.get(selected_ticker.upper())
    if not status:
        return f"No data for {selected_ticker.upper()}"
    
    return (f"### 📊 Detailed Status — {selected_ticker.upper()}\n\n"
            f"**Running:** {status.get('running', False)}\n"
            f"**Portfolio Value:** ${status.get('portfolio_value', 0):,.2f}\n"
            f"**Unrealized P&L:** ${status.get('unrealized_pnl', 0):,.2f}\n"
            f"**Current Drawdown:** {status.get('current_drawdown_pct', 0):.2f}%  |  "
            f"**Max Drawdown:** {status.get('max_drawdown_pct', 0):.2f}%\n"
            f"**Win Rate:** {status.get('win_rate', 0):.1f}%  |  "
            f"**Total Trades:** {status.get('total_trades', 0)}\n"
            f"**Position:** {status.get('position', 0):.4f} shares @ ${status.get('entry_price', 0):.2f}")


def get_price_chart(ticker: str):
    try:
        ticker = ticker.strip().upper()
        df = yf.download(ticker, period="5d", interval="5m", progress=False)
        if df.empty:
            fig = go.Figure()
            fig.update_layout(title=f"No data for {ticker}")
            return fig, "No market data available"
        
        fig = go.Figure(data=[go.Candlestick(
            x=df.index,
            open=df['Open'], high=df['High'], low=df['Low'], close=df['Close']
        )])
        fig.update_layout(
            title=f"{ticker} — Live 5m Candlestick (Last 5 Days)",
            template="plotly_dark",
            height=520,
            xaxis_rangeslider_visible=False
        )
        return fig, f"✅ Updated chart for {ticker}"
    except Exception as e:
        return go.Figure(), f"Chart error: {str(e)}"


def run_analysis(ticker: str):
    try:
        ticker = ticker.strip().upper()
        df = yf.download(ticker, period="60d", interval="1h", progress=False)
        analyzer = TrendlineAnalyzer()
        result = analyzer.analyze(df, ticker)
        return f"### ✅ Trendline Analysis — {ticker}\n\n{result.get('prediction_text','')}\n\n**Predicted Target Price:** ${result.get('predicted_price',0):.2f}"
    except Exception as e:
        return f"❌ Analysis error: {str(e)}"


def run_backtest_and_plot(ticker: str, period: str):
    try:
        result = run_backtest(ticker.strip().upper(), period)
        if "error" in result:
            return None, f"Backtest failed: {result['error']}"
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(y=result.get("equity_curve", []), mode='lines', name='Equity', line=dict(color='#00ff88')))
        fig.update_layout(
            title=f"Backtest Equity Curve — {ticker.upper()} ({period})",
            xaxis_title="Bar", yaxis_title="Portfolio Value ($)",
            template="plotly_dark", height=420
        )
        
        stats = (f"**Total Return:** {result.get('total_return_pct',0):.2f}%\n"
                 f"**Trades:** {result.get('num_trades',0)} | **Win Rate:** {result.get('win_rate',0):.1f}%\n"
                 f"**Max Drawdown:** {result.get('max_drawdown',0):.2f}%")
        return fig, stats
    except Exception as e:
        return None, f"Backtest error: {str(e)}"


def get_all_trades():
    # Assuming bot_manager has a way to get combined trades
    all_trades = []
    for ticker, bot in bot_manager.bots.items() if hasattr(bot_manager, 'bots') else {}:
        if hasattr(bot, 'trades'):
            for trade in bot.trades:
                trade['ticker'] = ticker
                all_trades.append(trade)
    if not all_trades:
        return pd.DataFrame(columns=["Ticker", "Time", "Action", "Price", "Qty", "P&L", "Reason"])
    
    df = pd.DataFrame(all_trades)
    if 'time' in df.columns:
        df['Time'] = pd.to_datetime(df['time']).dt.strftime('%Y-%m-%d %H:%M')
    df = df.rename(columns={"action": "Action", "price": "Price", "qty": "Qty", "pnl": "P&L", "reason": "Reason"})
    return df[["Ticker", "Time", "Action", "Price", "Qty", "P&L", "Reason"]]


# ====================== UI ======================

with gr.Blocks(title="FinEventAI Trading Dashboard", theme=gr.themes.Dark()) as dashboard:
    gr.Markdown("# 📈 FinEventAI Multi-Bot Trading Dashboard")

    with gr.Tabs():
        # ==================== CONTROL TAB ====================
        with gr.Tab("🎮 Control & Monitoring"):
            with gr.Row():
                with gr.Column(scale=2):
                    ticker_input = gr.Textbox(label="Ticker", value="SPX", placeholder="SPX, AAPL, BTC-USD")
                    
                    with gr.Row():
                        paper_toggle = gr.Checkbox(label="Paper Trading", value=True)
                        start_btn = gr.Button("🚀 Start Bot", variant="primary", size="large")
                        stop_btn = gr.Button("⛔ Stop Bot", variant="stop", size="large")

                    # Position & Risk Controls
                    with gr.Accordion("⚙️ Position Sizing & Risk Settings", open=False):
                        initial_capital = gr.Slider(1000, 100000, value=10000, step=500, label="Initial Capital ($)")
                        risk_pct = gr.Slider(0.1, 5.0, value=1.0, step=0.1, label="Risk per Trade (%)")
                        max_position = gr.Slider(0.1, 10.0, value=2.0, step=0.1, label="Max Position Size (multiple of risk)")

                with gr.Column(scale=3):
                    status_text = gr.Markdown("No bots running.")

            with gr.Row():
                refresh_btn = gr.Button("🔄 Refresh All Status", size="small")
                chart_btn = gr.Button("📊 Refresh Price Chart", size="small")

            live_chart = gr.Plot(label="Live Price Chart")
            chart_info = gr.Textbox(label="Chart Status", interactive=False, visible=False)

            # Per-bot detailed view
            with gr.Row():
                active_tickers = gr.Dropdown(choices=[], label="Select Bot for Details", interactive=True)
                detail_status = gr.Markdown("Select a ticker above")

        # ==================== ANALYSIS TAB ====================
        with gr.Tab("📊 Analysis"):
            analyze_btn = gr.Button("Run Fresh Trendline Analysis", variant="primary")
            analysis_output = gr.Markdown()

        # ==================== BACKTEST TAB ====================
        with gr.Tab("🔬 Backtesting"):
            with gr.Row():
                backtest_ticker = gr.Textbox(label="Ticker", value="SPX")
                backtest_period = gr.Dropdown(["1mo", "3mo", "6mo", "1y"], value="6mo", label="Period")
                backtest_btn = gr.Button("Run Backtest", variant="primary")
            
            backtest_chart = gr.Plot()
            backtest_stats = gr.Markdown()

        # ==================== TRADE HISTORY TAB ====================
        with gr.Tab("📜 Trade History"):
            trade_df = gr.DataFrame(label="All Trades Across Bots", interactive=False)

    # ====================== EVENTS ======================

    start_btn.click(
        start_bot_ui,
        inputs=[ticker_input, paper_toggle, initial_capital, risk_pct, max_position],
        outputs=status_text
    ).then(lambda: gr.update(choices=list(bot_manager.get_all_status().keys())), outputs=active_tickers)

    stop_btn.click(stop_bot_ui, inputs=ticker_input, outputs=status_text)

    refresh_btn.click(get_multi_status, outputs=status_text)

    # Update active tickers dropdown after refresh
    refresh_btn.click(
        lambda: gr.update(choices=list(bot_manager.get_all_status().keys())),
        outputs=active_tickers
    )

    active_tickers.change(get_detailed_bot_status, inputs=active_tickers, outputs=detail_status)

    chart_btn.click(get_price_chart, inputs=ticker_input, outputs=[live_chart, chart_info])

    analyze_btn.click(run_analysis, inputs=ticker_input, outputs=analysis_output)

    backtest_btn.click(
        run_backtest_and_plot,
        inputs=[backtest_ticker, backtest_period],
        outputs=[backtest_chart, backtest_stats]
    )

    # Live updates
    dashboard.load(get_multi_status, outputs=status_text, every=10)
    dashboard.load(
        lambda: gr.update(choices=list(bot_manager.get_all_status().keys())),
        outputs=active_tickers,
        every=12
    )
    dashboard.load(get_all_trades, outputs=trade_df, every=15)

    # Auto-refresh chart every 30s when Control tab is active (approximated)
    # For simplicity we keep manual + load refresh

if __name__ == "__main__":
    logger.info("🌐 FinEventAI Dashboard running → http://0.0.0.0:7861")
    dashboard.queue().launch(
        server_name="0.0.0.0",
        server_port=7861,
        share=False
    )