import paramiko

def upload_and_reload():
    hostname = "5.129.247.149"
    username = "root"
    password = "mYMgrxD_7JS3+?"
    local_path = "/Users/apple/Desktop/bronly/scratch/nginx_bronly_ssl.conf"
    remote_path = "/etc/nginx/sites-available/bronly"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"Connecting to {hostname}...")
        client.connect(hostname, port=22, username=username, password=password, timeout=15)
        print("Connected! Uploading Nginx configuration file...")

        # SFTP Upload
        sftp = client.open_sftp()
        sftp.put(local_path, remote_path)
        sftp.close()
        print("Upload complete!")

        # Verify and reload Nginx
        print("Testing Nginx configuration...")
        stdin, stdout, stderr = client.exec_command("nginx -t")
        err = stderr.read().decode()
        out = stdout.read().decode()
        print(out)
        print(err)
        
        status = stdout.channel.recv_exit_status()
        if status != 0:
            print("Nginx configuration test failed!")
            return

        print("Nginx configuration test passed! Reloading Nginx...")
        stdin, stdout, stderr = client.exec_command("systemctl reload nginx")
        reload_status = stdout.channel.recv_exit_status()
        if reload_status == 0:
            print("Nginx reloaded successfully!")
        else:
            print(f"Failed to reload Nginx. Exit status: {reload_status}")
            print(stderr.read().decode())

    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    upload_and_reload()
