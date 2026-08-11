<?php
// 文字エンコーディング設定
mb_internal_encoding('UTF-8');
mb_language('Japanese');

// セッション開始
session_start();

// 1行入力欄の取得(改行・制御文字を除去してヘッダインジェクションを防ぐ)
function get_line_input($key) {
    $value = filter_input(INPUT_POST, $key) ?? '';
    return trim(preg_replace('/[\r\n\t\0\x0B]/', '', $value));
}

// エラーメッセージの配列
$errors = [];

// POSTリクエストの確認
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // スパムボット対策(ハニーポット: フォームに hidden で name="website" を置き、入力があれば無視)
    if (!empty($_POST['website'])) {
        header('Location: /contact/thanks.html');
        exit;
    }

    // 入力値の取得とバリデーション
    $name    = get_line_input('name');
    $email   = get_line_input('email');
    $phone   = get_line_input('phone');
    $subject = get_line_input('subject');
    $message = trim(filter_input(INPUT_POST, 'message') ?? '');
    $privacy = isset($_POST['privacy']);

    // バリデーション
    if ($name === '') {
        $errors[] = 'お名前を入力してください。';
    }
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = '有効なメールアドレスを入力してください。';
    }
    if ($phone !== '' && !preg_match('/^[0-9\-]+$/', $phone)) {
        $errors[] = '電話番号は数字とハイフンのみ使用できます。';
    }
    if ($subject === '') {
        $errors[] = '件名を入力してください。';
    }
    if ($message === '') {
        $errors[] = 'お問い合わせ内容を入力してください。';
    }
    if (!$privacy) {
        $errors[] = 'プライバシーポリシーに同意してください。';
    }

    // エラーがない場合の処理
    if (empty($errors)) {
        // メール送信先(自ドメインの実在アドレスに変更してください)
        $to = 'info@sakurai-crc.org';

        // メール本文
        $body = "以下の内容でお問い合わせがありました。\n\n";
        $body .= "お名前: {$name}\n";
        $body .= "メールアドレス: {$email}\n";
        $body .= "電話番号: {$phone}\n";
        $body .= "件名: {$subject}\n\n";
        $body .= "お問い合わせ内容:\n{$message}\n";

        // メールヘッダー
        // From は自ドメイン固定(訪問者のアドレスを From にすると SPF/DMARC で迷惑メール判定される)
        $headers = "From: noreply@sakurai-crc.org\r\n";
        $headers .= "Reply-To: {$email}\r\n";

        // メール送信
        if (mb_send_mail($to, "【お問い合わせ】{$subject}", $body, $headers)) {
            // 送信成功時の処理
            $_SESSION['success'] = true;
            header('Location: /contact/thanks.html');
            exit;
        } else {
            // 送信失敗時の処理
            $errors[] = 'メールの送信に失敗しました。時間をおいて再度お試しください。';
        }
    }
}

// エラーがある場合は入力画面に戻る
if (!empty($errors)) {
    $_SESSION['errors'] = $errors;
    $_SESSION['form_data'] = [
        'name' => $name ?? '',
        'email' => $email ?? '',
        'phone' => $phone ?? '',
        'subject' => $subject ?? '',
        'message' => $message ?? '',
        'privacy' => $privacy ?? false
    ];
    header('Location: /contact.html');
    exit;
}
?>
