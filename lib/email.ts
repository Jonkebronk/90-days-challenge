import { Resend } from 'resend'

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = process.env.EMAIL_FROM || 'Friskvårdskompassen <noreply@friskvardskompassen.com>'

/**
 * Send password reset email with a link to reset password
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  name?: string
): Promise<boolean> {
  try {
    // If no API key, log to console (development mode)
    if (!process.env.RESEND_API_KEY) {
      console.log('=================================')
      console.log('PASSWORD RESET EMAIL (dev mode)')
      console.log('To:', email)
      console.log('Name:', name || 'N/A')
      console.log('Reset URL:', resetUrl)
      console.log('=================================')
      return true
    }

    await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Återställ ditt lösenord - Friskvårdskompassen',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: #FFD700; margin: 0 0 20px 0; font-size: 24px;">Återställ ditt lösenord</h1>

            <p style="color: #fff; margin: 0 0 15px 0;">
              Hej${name ? ` ${name}` : ''},
            </p>

            <p style="color: #ccc; margin: 0 0 20px 0;">
              Vi har mottagit en begäran om att återställa ditt lösenord. Klicka på knappen nedan för att välja ett nytt lösenord:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Återställ lösenord
              </a>
            </div>

            <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
              Länken är giltig i 1 timme. Om du inte begärt detta kan du ignorera mejlet.
            </p>

            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; margin: 0;">
              Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:<br>
              <a href="${resetUrl}" style="color: #FFD700; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </body>
        </html>
      `,
    })

    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}

/**
 * Send email with new temporary password (coach-initiated reset)
 */
export async function sendNewPasswordEmail(
  email: string,
  temporaryPassword: string,
  name?: string
): Promise<boolean> {
  try {
    // If no API key, log to console (development mode)
    if (!process.env.RESEND_API_KEY) {
      console.log('=================================')
      console.log('NEW PASSWORD EMAIL (dev mode)')
      console.log('To:', email)
      console.log('Name:', name || 'N/A')
      console.log('Temporary Password:', temporaryPassword)
      console.log('=================================')
      return true
    }

    await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Ditt lösenord har återställts - Friskvårdskompassen',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: #FFD700; margin: 0 0 20px 0; font-size: 24px;">Ditt lösenord har återställts</h1>

            <p style="color: #fff; margin: 0 0 15px 0;">
              Hej${name ? ` ${name}` : ''},
            </p>

            <p style="color: #ccc; margin: 0 0 20px 0;">
              Din coach har återställt ditt lösenord. Här är ditt nya temporära lösenord:
            </p>

            <div style="background: rgba(255,215,0,0.1); border: 2px solid #FFD700; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Temporärt lösenord</p>
              <p style="color: #FFD700; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${temporaryPassword}</p>
            </div>

            <p style="color: #ccc; margin: 20px 0;">
              <strong style="color: #fff;">Viktigt:</strong> Logga in och byt till ett eget lösenord så snart som möjligt.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/login" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Logga in
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; margin: 0;">
              Om du inte förväntat dig detta mejl, kontakta din coach.
            </p>
          </div>
        </body>
        </html>
      `,
    })

    return true
  } catch (error) {
    console.error('Failed to send new password email:', error)
    return false
  }
}

/**
 * Send invitation email to new client
 */
export async function sendInvitationEmail(
  email: string,
  invitationUrl: string,
  name?: string,
  coachName?: string
): Promise<boolean> {
  try {
    // If no API key, log to console (development mode)
    if (!process.env.RESEND_API_KEY) {
      console.log('=================================')
      console.log('INVITATION EMAIL (dev mode)')
      console.log('To:', email)
      console.log('Name:', name || 'N/A')
      console.log('Coach:', coachName || 'N/A')
      console.log('Invitation URL:', invitationUrl)
      console.log('=================================')
      return true
    }

    await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Välkommen till Friskvårdskompassen!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f0f19; font-family: Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f0f19;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1a1a2e; border-radius: 12px; border: 1px solid #2a2a4e;">
                  <!-- Header with logo area -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 2px solid #FFD700;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #FFD700;">
                        Friskvårdskompassen
                      </h1>
                      <p style="margin: 10px 0 0 0; font-size: 14px; color: #888;">Din vägvisare till bättre hälsa</p>
                    </td>
                  </tr>

                  <!-- Main content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff;">
                        Välkommen${name ? `, ${name}` : ''}! 🎉
                      </h2>

                      <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #cccccc;">
                        ${coachName ? `<strong style="color: #FFD700;">${coachName}</strong> har bjudit in dig` : 'Du har blivit inbjuden'} till att bli en del av Friskvårdskompassen - en plattform för personlig coaching och hälsa.
                      </p>

                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #cccccc;">
                        Klicka på knappen nedan för att skapa ditt konto och komma igång med din resa mot bättre hälsa:
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="padding: 10px 0 30px 0;">
                            <a href="${invitationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #FFD700; color: #1a1a2e; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);">
                              Skapa mitt konto →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- What to expect -->
                      <div style="background-color: #252545; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                        <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; color: #FFD700;">
                          Vad du får tillgång till:
                        </p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 5px 0; font-size: 14px; color: #cccccc;">✓ Personligt träningsprogram</td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0; font-size: 14px; color: #cccccc;">✓ Anpassat kostschema</td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0; font-size: 14px; color: #cccccc;">✓ Direkt kontakt med din coach</td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0; font-size: 14px; color: #cccccc;">✓ Framstegsspårning och check-ins</td>
                          </tr>
                        </table>
                      </div>

                      <p style="margin: 0; font-size: 13px; color: #888888;">
                        ⏰ Inbjudan är giltig i 30 dagar.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #151528; border-radius: 0 0 12px 12px; border-top: 1px solid #2a2a4e;">
                      <p style="margin: 0 0 10px 0; font-size: 12px; color: #666666;">
                        Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:
                      </p>
                      <p style="margin: 0; font-size: 11px; word-break: break-all;">
                        <a href="${invitationUrl}" style="color: #FFD700;">${invitationUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Footer text -->
                <p style="margin: 30px 0 0 0; font-size: 11px; color: #555555; text-align: center;">
                  © ${new Date().getFullYear()} Friskvårdskompassen. Alla rättigheter förbehållna.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    return true
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    return false
  }
}

/**
 * Send welcome email after account setup
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string,
  coachName?: string
): Promise<boolean> {
  try {
    // If no API key, log to console (development mode)
    if (!process.env.RESEND_API_KEY) {
      console.log('=================================')
      console.log('WELCOME EMAIL (dev mode)')
      console.log('To:', email)
      console.log('Name:', name || 'N/A')
      console.log('Coach:', coachName || 'N/A')
      console.log('=================================')
      return true
    }

    await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Ditt konto är klart - Friskvårdskompassen',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: #FFD700; margin: 0 0 20px 0; font-size: 24px;">Ditt konto är klart! 🎉</h1>

            <p style="color: #fff; margin: 0 0 15px 0;">
              Hej${name ? ` ${name}` : ''},
            </p>

            <p style="color: #ccc; margin: 0 0 20px 0;">
              Ditt konto för Friskvårdskompassen är nu aktiverat. Du kan nu logga in och börja din resa mot dina mål!
            </p>

            ${coachName ? `
            <p style="color: #ccc; margin: 0 0 20px 0;">
              Din coach <strong style="color: #FFD700;">${coachName}</strong> finns tillgänglig för att hjälpa dig på vägen.
            </p>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/login" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Logga in
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; margin: 0;">
              Vi ser fram emot att följa din resa!
            </p>
          </div>
        </body>
        </html>
      `,
    })

    return true
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return false
  }
}

/**
 * Send check-in reminder email (for Sunday cron job)
 */
export async function sendCheckInReminderEmail(
  email: string,
  name?: string,
  coachName?: string
): Promise<boolean> {
  try {
    // If no API key, log to console (development mode)
    if (!process.env.RESEND_API_KEY) {
      console.log('=================================')
      console.log('CHECK-IN REMINDER EMAIL (dev mode)')
      console.log('To:', email)
      console.log('Name:', name || 'N/A')
      console.log('=================================')
      return true
    }

    const loginUrl = `${process.env.NEXTAUTH_URL}/login`

    await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Påminnelse: Dags för veckans check-in! 📊',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: #FFD700; margin: 0 0 20px 0; font-size: 24px;">Dags för check-in! 📊</h1>

            <p style="color: #fff; margin: 0 0 15px 0;">
              Hej${name ? ` ${name}` : ''},
            </p>

            <p style="color: #ccc; margin: 0 0 20px 0;">
              Det är söndag och dags för din vecko-check-in! Ta några minuter och rapportera hur din vecka har gått.
            </p>

            <div style="background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3); border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #FFD700; margin: 0; font-weight: bold;">Kom ihåg att:</p>
              <ul style="color: #ccc; margin: 10px 0 0 0; padding-left: 20px;">
                <li>Väga dig och logga vikten</li>
                <li>Ta nya formbilder (om det är dags)</li>
                <li>Berätta hur veckan har gått</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Gör din check-in nu
              </a>
            </div>

            ${coachName ? `
            <p style="color: #999; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
              ${coachName} ser fram emot att höra hur det går! 💪
            </p>
            ` : ''}

            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; margin: 0; text-align: center;">
              Du får detta mejl eftersom du är aktiv klient hos Friskvårdskompassen.
            </p>
          </div>
        </body>
        </html>
      `,
    })

    return true
  } catch (error) {
    console.error('Failed to send check-in reminder email:', error)
    return false
  }
}
