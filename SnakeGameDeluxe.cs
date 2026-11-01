// Snake Game Deluxe - versão Windows portátil
// © 2026 Cauã Meneghetti dos Santos. Todos os direitos reservados.
// Compilação: executar GERAR_EXE.bat em um Windows com .NET Framework 4.8.

using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace SnakeGameDeluxe
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new GameForm());
        }
    }

    public class GameForm : Form
    {
        const int Cell = 22, Cols = 26, Rows = 22;
        Panel board;
        Timer timer;
        Label scoreLabel, statusLabel;
        Button startButton, pauseButton, menuButton;
        ComboBox difficulty;
        TextBox playerName;
        List<Point> snake = new List<Point>();
        Point food;
        int dx = 1, dy = 0, score = 0, speed = 125;
        bool running = false, paused = false, gameOver = false;
        readonly Random random = new Random();
        readonly string scoreFile = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "SnakeGameDeluxe", "recordes.txt");

        public GameForm()
        {
            Text = "Snake Game Deluxe";
            ClientSize = new Size(Cols * Cell + 40, Rows * Cell + 150);
            MinimumSize = new Size(520, 650);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(13, 20, 36);
            ForeColor = Color.White;
            Font = new Font("Segoe UI", 10);
            KeyPreview = true;

            var title = new Label { Text = "SNAKE GAME DELUXE", Font = new Font("Segoe UI", 20, FontStyle.Bold),
                ForeColor = Color.FromArgb(70, 230, 160), AutoSize = true, Location = new Point(18, 12) };
            Controls.Add(title);

            playerName = new TextBox { Text = "Jogador", Location = new Point(20, 62), Width = 145 };
            difficulty = new ComboBox { Location = new Point(175, 62), Width = 130, DropDownStyle = ComboBoxStyle.DropDownList };
            difficulty.Items.AddRange(new object[] { "Fácil", "Normal", "Difícil" });
            difficulty.SelectedIndex = 1;
            startButton = new Button { Text = "JOGAR", Location = new Point(315, 60), Width = 85, Height = 30 };
            pauseButton = new Button { Text = "PAUSAR", Location = new Point(405, 60), Width = 85, Height = 30, Enabled = false };
            menuButton = new Button { Text = "NOVO JOGO", Location = new Point(20, 98), Width = 120, Height = 28 };
            scoreLabel = new Label { Text = "Pontos: 0", Location = new Point(155, 102), AutoSize = true, ForeColor = Color.Gold };
            statusLabel = new Label { Text = "Escolha seu nome e pressione JOGAR.", Location = new Point(250, 102), AutoSize = true };
            Controls.AddRange(new Control[] { playerName, difficulty, startButton, pauseButton, menuButton, scoreLabel, statusLabel });

            board = new Panel { Location = new Point(20, 140), Size = new Size(Cols * Cell, Rows * Cell),
                BackColor = Color.FromArgb(8, 14, 26), BorderStyle = BorderStyle.FixedSingle };
            board.Paint += DrawBoard;
            Controls.Add(board);

            timer = new Timer();
            timer.Tick += Tick;
            startButton.Click += (s, e) => StartGame();
            menuButton.Click += (s, e) => StartGame();
            pauseButton.Click += (s, e) => TogglePause();
            KeyDown += HandleKeys;
            FormClosing += (s, e) => timer.Stop();
            ShowRanking();
        }

        void StartGame()
        {
            int selected = difficulty.SelectedIndex;
            speed = selected == 0 ? 170 : selected == 2 ? 80 : 125;
            snake = new List<Point> { new Point(Cols / 2, Rows / 2), new Point(Cols / 2 - 1, Rows / 2), new Point(Cols / 2 - 2, Rows / 2) };
            dx = 1; dy = 0; score = 0; paused = false; gameOver = false; running = true;
            SpawnFood();
            timer.Interval = speed; timer.Start();
            pauseButton.Enabled = true; pauseButton.Text = "PAUSAR";
            scoreLabel.Text = "Pontos: 0"; statusLabel.Text = "Use as setas ou WASD";
            board.Invalidate(); board.Focus();
        }

        void TogglePause()
        {
            if (!running) return;
            paused = !paused;
            if (paused) timer.Stop(); else timer.Start();
            pauseButton.Text = paused ? "CONTINUAR" : "PAUSAR";
            statusLabel.Text = paused ? "JOGO PAUSADO" : "Use as setas ou WASD";
            board.Invalidate();
        }

        void HandleKeys(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Space) { TogglePause(); e.Handled = true; return; }
            int ndx = dx, ndy = dy;
            if (e.KeyCode == Keys.Up || e.KeyCode == Keys.W) { ndx = 0; ndy = -1; }
            else if (e.KeyCode == Keys.Down || e.KeyCode == Keys.S) { ndx = 0; ndy = 1; }
            else if (e.KeyCode == Keys.Left || e.KeyCode == Keys.A) { ndx = -1; ndy = 0; }
            else if (e.KeyCode == Keys.Right || e.KeyCode == Keys.D) { ndx = 1; ndy = 0; }
            if (ndx != -dx || ndy != -dy) { dx = ndx; dy = ndy; }
        }

        void Tick(object sender, EventArgs e)
        {
            if (!running || paused) return;
            Point head = new Point(snake[0].X + dx, snake[0].Y + dy);
            if (head.X < 0 || head.Y < 0 || head.X >= Cols || head.Y >= Rows || snake.Contains(head))
            { EndGame(); return; }
            snake.Insert(0, head);
            if (head == food) { score += 10; scoreLabel.Text = "Pontos: " + score; SpawnFood(); }
            else snake.RemoveAt(snake.Count - 1);
            board.Invalidate();
        }

        void SpawnFood()
        {
            do { food = new Point(random.Next(Cols), random.Next(Rows)); }
            while (snake.Contains(food));
        }

        void EndGame()
        {
            timer.Stop(); running = false; gameOver = true; pauseButton.Enabled = false;
            statusLabel.Text = "Fim de jogo! Pontuação: " + score;
            SaveScore(); ShowRanking(); board.Invalidate();
            MessageBox.Show("Fim de jogo!\nPontuação: " + score, "Snake Game Deluxe", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        void DrawBoard(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            using (var grid = new Pen(Color.FromArgb(22, 39, 55)))
            {
                for (int x = 0; x <= Cols; x++) g.DrawLine(grid, x * Cell, 0, x * Cell, Rows * Cell);
                for (int y = 0; y <= Rows; y++) g.DrawLine(grid, 0, y * Cell, Cols * Cell, y * Cell);
            }
            using (var brush = new SolidBrush(Color.FromArgb(255, 83, 100)))
                g.FillEllipse(brush, food.X * Cell + 3, food.Y * Cell + 3, Cell - 6, Cell - 6);
            for (int i = 0; i < snake.Count; i++)
            {
                using (var brush = new SolidBrush(i == 0 ? Color.FromArgb(70, 230, 160) : Color.FromArgb(35, 175, 125)))
                    g.FillRoundedRectangleCompat(brush, snake[i].X * Cell + 1, snake[i].Y * Cell + 1, Cell - 2, Cell - 2);
            }
            if (paused || !running)
            {
                string msg = paused ? "PAUSADO" : "SNAKE GAME DELUXE";
                using (var font = new Font("Segoe UI", 18, FontStyle.Bold))
                using (var brush = new SolidBrush(Color.White))
                {
                    SizeF sz = g.MeasureString(msg, font);
                    g.DrawString(msg, font, brush, (board.Width - sz.Width) / 2, (board.Height - sz.Height) / 2);
                }
            }
        }

        void SaveScore()
        {
            try {
                Directory.CreateDirectory(Path.GetDirectoryName(scoreFile));
                string name = String.IsNullOrWhiteSpace(playerName.Text) ? "Jogador" : playerName.Text.Trim();
                File.AppendAllText(scoreFile, name.Replace("|", "") + "|" + score + Environment.NewLine);
            } catch { }
        }

        void ShowRanking()
        {
            try {
                if (!File.Exists(scoreFile)) return;
                var lines = File.ReadAllLines(scoreFile).Select(l => l.Split('|')).Where(a => a.Length == 2)
                    .Select(a => new { Name = a[0], Points = int.Parse(a[1]) }).OrderByDescending(a => a.Points).Take(5).ToList();
                if (lines.Count > 0)
                    statusLabel.Text = "TOP 5: " + String.Join("   ", lines.Select((a, i) => (i + 1) + "º " + a.Name + " - " + a.Points));
            } catch { }
        }
    }

    static class GraphicsExtensions
    {
        public static void FillRoundedRectangleCompat(this Graphics g, Brush b, int x, int y, int w, int h)
        {
            g.FillRectangle(b, x + 3, y, w - 6, h);
            g.FillRectangle(b, x, y + 3, w, h - 6);
        }
    }
}
